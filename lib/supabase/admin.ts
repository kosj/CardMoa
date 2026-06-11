import { createClient } from '@supabase/supabase-js';

/**
 * 서비스 롤 클라이언트 — RLS를 우회하는 서버 전용 클라이언트.
 * 반드시 서버 사이드(API Route, Server Action)에서만 사용해야 한다.
 * SUPABASE_SERVICE_ROLE_KEY는 절대 클라이언트로 노출되어서는 안 된다.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error('Supabase admin credentials are not configured');
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
