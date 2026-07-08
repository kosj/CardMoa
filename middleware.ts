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

    // 세션 갱신 목적으로만 호출 (로그인 없이 공개 접근하므로 리다이렉트 없음)
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
