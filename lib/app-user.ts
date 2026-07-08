import { createAdminClient } from '@/lib/supabase/admin';

/** 로그인 없이 보여줄 고정 계정 이메일 */
export const APP_USER_EMAIL = (
  process.env.APP_USER_EMAIL || 'godkosj@gmail.com'
).toLowerCase();

let cachedId: string | null = null;

/**
 * 고정 계정의 Supabase user UUID를 반환한다.
 * - APP_USER_ID 환경변수가 있으면 그대로 사용 (빠른 경로)
 * - 없으면 APP_USER_EMAIL로 admin API에서 조회 후 캐시
 */
export async function getAppUserId(): Promise<string | null> {
  if (cachedId) return cachedId;

  const envId = process.env.APP_USER_ID;
  if (envId) {
    cachedId = envId;
    return cachedId;
  }

  try {
    const admin = createAdminClient();
    // 이메일로 사용자 검색 (페이지네이션)
    for (let page = 1; page <= 10; page++) {
      const { data, error } = await admin.auth.admin.listUsers({
        page,
        perPage: 200,
      });
      if (error) {
        console.error('[app-user] listUsers 오류:', error.message);
        return null;
      }
      const found = data.users.find(
        (u) => u.email?.toLowerCase() === APP_USER_EMAIL
      );
      if (found) {
        cachedId = found.id;
        return cachedId;
      }
      if (data.users.length < 200) break; // 마지막 페이지
    }
    console.error('[app-user] 사용자를 찾을 수 없음:', APP_USER_EMAIL);
    return null;
  } catch (err) {
    console.error('[app-user] 예외:', err);
    return null;
  }
}
