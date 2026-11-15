import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { FAMILY_COOKIE, isValidFamilyCookie } from '@/lib/family-gate';

/**
 * 가족 암호로 잠그는 경로.
 * - /dashboard : 노트 화면과, 그 경로로 들어오는 서버 액션 POST 전부
 * - /auth      : /auth/auto 가 고정 가족 계정으로 Supabase 세션을 바로 만들어 주므로
 *                (공개 anon 키와 함께 쓰면 RLS 너머의 데이터를 직접 읽을 수 있다) 함께 잠근다.
 * 잠그지 않는 곳: / (랜딩), /unlock, /api/* (웹훅은 자체 시크릿), _next 정적 파일
 */
const GATED_PREFIXES = ['/dashboard', '/auth'];

function isGatedPath(pathname: string): boolean {
  let path = pathname;
  try {
    // %64ashboard 같은 인코딩·대소문자·중복 슬래시로 우회하지 못하게 정규화해서 본다
    path = decodeURIComponent(pathname);
  } catch {
    // 잘못된 인코딩이면 원래 값으로 판단
  }
  path = path.replace(/\/{2,}/g, '/').toLowerCase();
  return GATED_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

function lockedResponse(request: NextRequest): NextResponse {
  // 돌아올 주소: 원래 경로 + 검색어 (RSC 내부용 _rsc 파라미터는 뺀다)
  const params = new URLSearchParams(request.nextUrl.search);
  params.delete('_rsc');
  const query = params.toString();
  const next = `${request.nextUrl.pathname}${query ? `?${query}` : ''}`;

  const unlockUrl = request.nextUrl.clone();
  unlockUrl.pathname = '/unlock';
  unlockUrl.search = '';
  unlockUrl.searchParams.set('next', next);

  const noStore = { 'Cache-Control': 'private, no-store' };

  // 클라이언트에서 부른 서버 액션(fetch): 액션은 실행하지 않고, Next 라우터가 알아듣는
  // x-action-redirect 헤더로 잠금 화면으로 보낸다
  if (request.headers.has('next-action')) {
    return new NextResponse(null, {
      status: 401,
      headers: { ...noStore, 'x-action-redirect': `${unlockUrl.pathname}${unlockUrl.search}` },
    });
  }

  // GET/HEAD는 307, 그 밖의 요청(JS 없는 폼 POST 등)은 303으로 바꿔 GET으로 잠금 화면을 연다
  const isRead = request.method === 'GET' || request.method === 'HEAD';
  const response = NextResponse.redirect(unlockUrl, isRead ? 307 : 303);
  response.headers.set('Cache-Control', noStore['Cache-Control']);
  return response;
}

export async function middleware(request: NextRequest) {
  // ① 가족 암호 잠금 — Supabase 설정과 무관하게 항상 먼저 확인한다 (암호 미설정 시에도 잠김)
  if (isGatedPath(request.nextUrl.pathname)) {
    const unlocked = await isValidFamilyCookie(request.cookies.get(FAMILY_COOKIE)?.value);
    if (!unlocked) return lockedResponse(request);
  }

  // ② Supabase 세션 갱신 (기존 동작 유지)
  let supabaseResponse = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // 환경변수 미설정 시 미들웨어 통과 (빌드/개발 초기 대응)
  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse;
  }

  type SetOptions = Parameters<typeof supabaseResponse.cookies.set>[2];
  type CookieToSet = { name: string; value: string; options?: SetOptions };

  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    });

    // 세션 갱신 목적으로만 호출 (화면 접근 제어는 위의 가족 암호가 맡는다)
    await supabase.auth.getUser();
  } catch (err) {
    // Supabase 호출 실패 시 요청을 막지 않고 통과
    console.error('[middleware] Supabase error:', err);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/).*)',
  ],
};
