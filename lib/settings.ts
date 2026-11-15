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

/* ──────────────────────────────────────────────
   바다 건너 D-day — 머무는 도시, 떠난 날, 다음 만남
   (공개 저장소이므로 실제 값은 코드에 두지 않고 DB에만 저장)
   ────────────────────────────────────────────── */

export interface AbroadInfo {
  /** 머무는 도시 이름 (1~20자) */
  city: string | null;
  /** 떠난 날 'YYYY-MM-DD' */
  since: string | null;
  /** 다음에 만날 날 'YYYY-MM-DD' */
  nextVisit: string | null;
}

const EMPTY_ABROAD: AbroadInfo = { city: null, since: null, nextVisit: null };

export async function getAbroadInfo(userId: string): Promise<AbroadInfo> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('app_settings')
      .select('abroad_city, abroad_since, next_visit')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      // 컬럼이 없으면(마이그레이션 008 미실행) 여기로 온다 — 설정 안 된 상태로 표시
      console.error('[settings] 바다 건너 설정 조회 오류:', error.message);
      return EMPTY_ABROAD;
    }
    return {
      city: data?.abroad_city ?? null,
      since: data?.abroad_since ?? null,
      nextVisit: data?.next_visit ?? null,
    };
  } catch (err) {
    console.error('[settings] 예외:', err);
    return EMPTY_ABROAD;
  }
}

/** 고정 계정 기준으로 바다 건너 설정을 읽는다. (서버 컴포넌트용) */
export async function getAppAbroadInfo(): Promise<AbroadInfo> {
  const userId = await getAppUserId();
  if (!userId) return EMPTY_ABROAD;
  return getAbroadInfo(userId);
}

export async function setAbroadInfo(
  userId: string,
  info: AbroadInfo
): Promise<boolean> {
  const admin = createAdminClient();
  const { error } = await admin.from('app_settings').upsert(
    {
      user_id: userId,
      abroad_city: info.city,
      abroad_since: info.since,
      next_visit: info.nextVisit,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  );

  if (error) {
    console.error('[settings] 바다 건너 설정 저장 오류:', error.message);
    return false;
  }
  return true;
}

/* ──────────────────────────────────────────────
   미쿠 카드 — 미쿠를 누르면 뒤집혀 보이는 추억 사진 한 장
   가족이 직접 고른 경우에만 값이 있다. 사진이 지워지면 DB가 연결을 끊는다(ON DELETE SET NULL).
   ────────────────────────────────────────────── */

export async function getMikuMemoryId(userId: string): Promise<string | null> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('app_settings')
      .select('miku_memory_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      // 컬럼이 없으면(마이그레이션 009 미실행) 여기로 온다 — 사진 없는 미쿠로 표시
      console.error('[settings] 미쿠 카드 사진 조회 오류:', error.message);
      return null;
    }
    return data?.miku_memory_id ?? null;
  } catch (err) {
    console.error('[settings] 예외:', err);
    return null;
  }
}

/** 고정 계정 기준으로 미쿠 카드 사진 id를 읽는다. (서버 컴포넌트용) */
export async function getAppMikuMemoryId(): Promise<string | null> {
  const userId = await getAppUserId();
  if (!userId) return null;
  return getMikuMemoryId(userId);
}

/** 미쿠 카드 사진을 정한다. null이면 '사진 없이' */
export async function setMikuMemoryId(
  userId: string,
  memoryId: string | null
): Promise<boolean> {
  try {
    const admin = createAdminClient();
    const { error } = await admin.from('app_settings').upsert(
      {
        user_id: userId,
        miku_memory_id: memoryId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

    if (error) {
      // 컬럼이 없으면(마이그레이션 009 미실행) 여기로 온다
      console.error('[settings] 미쿠 카드 사진 저장 오류:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[settings] 미쿠 카드 사진 저장 예외:', err);
    return false;
  }
}
