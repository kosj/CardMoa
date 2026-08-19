import { createAdminClient } from '@/lib/supabase/admin';
import { getAppUserId } from '@/lib/app-user';

/**
 * 앱 설정 — 저장 경로(붙여넣기 UI·웹훅)가 공통으로 참조한다.
 * 브라우저가 아니라 DB에 두어야 웹훅에서도 같은 값을 볼 수 있다.
 */

/** app_settings 행이 아직 없을 때의 기본값 */
const DEFAULT_INCLUDE_DOMESTIC = true;

export async function getIncludeDomestic(userId: string): Promise<boolean> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('app_settings')
      .select('include_domestic')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      // 테이블이 없으면(마이그레이션 005 미실행) 여기로 온다
      console.error('[settings] 조회 오류:', error.message);
      return DEFAULT_INCLUDE_DOMESTIC;
    }
    return data?.include_domestic ?? DEFAULT_INCLUDE_DOMESTIC;
  } catch (err) {
    console.error('[settings] 예외:', err);
    return DEFAULT_INCLUDE_DOMESTIC;
  }
}

/** 고정 계정 기준으로 설정을 읽는다. (서버 컴포넌트용) */
export async function getAppIncludeDomestic(): Promise<boolean> {
  const userId = await getAppUserId();
  if (!userId) return DEFAULT_INCLUDE_DOMESTIC;
  return getIncludeDomestic(userId);
}

export async function setIncludeDomestic(
  userId: string,
  value: boolean
): Promise<boolean> {
  const admin = createAdminClient();
  const { error } = await admin.from('app_settings').upsert(
    {
      user_id: userId,
      include_domestic: value,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  );

  if (error) {
    console.error('[settings] 저장 오류:', error.message);
    return false;
  }
  return true;
}
