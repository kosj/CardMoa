import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Next.js 15부터 cookies()가 비동기 API — 호출부에서 await createClient() 필요
export async function createClient() {
  const cookieStore = await cookies();

  // cookieStore.set의 세 번째 인자 타입을 직접 추론 — 외부 타입 import 불필요
  type SetOptions = Parameters<typeof cookieStore.set>[2];

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: SetOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component 컨텍스트에서는 무시
          }
        },
      },
    }
  );
}
