import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
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

    // 세션 갱신 — getUser()는 반드시 호출해야 함
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const pathname = request.nextUrl.pathname;

    // 인증 콜백·자동 로그인 라우트는 그대로 통과 (리다이렉트 루프 방지)
    if (
      pathname.startsWith('/auth/callback') ||
      pathname.startsWith('/auth/auto')
    ) {
      return supabaseResponse;
    }

    // 미인증 상태로 대시보드 접근 시 → 자동 로그인 라우트로
    if (!user && pathname.startsWith('/dashboard')) {
      const url = request.nextUrl.clone();
      url.pathname = '/auth/auto';
      return NextResponse.redirect(url);
    }

    // 이미 로그인했는데 로그인 폼으로 가면 대시보드로
    if (user && pathname.startsWith('/auth/login')) {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }
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
