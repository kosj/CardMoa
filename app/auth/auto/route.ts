import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /auth/auto
 *
 * 로그인 화면 없이 바로 진입하기 위한 자동 로그인 라우트.
 * 서버 전용 환경변수(AUTO_LOGIN_EMAIL / AUTO_LOGIN_PASSWORD)에 저장된
 * 고정 계정으로 로그인한 뒤 대시보드로 이동한다.
 *
 * 환경변수가 없거나 로그인 실패 시 기존 로그인 폼(/auth/login)으로 폴백.
 */
export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const email = process.env.AUTO_LOGIN_EMAIL;
  const password = process.env.AUTO_LOGIN_PASSWORD;

  if (!email || !password) {
    console.error('[auto-login] AUTO_LOGIN_EMAIL/PASSWORD 미설정');
    return NextResponse.redirect(`${origin}/auth/login`);
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    console.error('[auto-login] 로그인 실패:', error.message);
    return NextResponse.redirect(`${origin}/auth/login`);
  }

  return NextResponse.redirect(`${origin}/dashboard`);
}
