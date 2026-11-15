import { createAdminClient } from '@/lib/supabase/admin';

/**
 * 아빠의 쪽지 — 대시보드 '아빠가 보낸 쪽지 💌'의 데이터 계층.
 * 서비스 롤로 읽고 쓰며, letters 테이블이 아직 없으면(마이그레이션 006 미실행)
 * 로그만 남기고 빈 값으로 물러난다. 화면이 멈추지 않는 것이 우선.
 */

export type Letter = {
  id: string;
  body: string;
  created_at: string;
  opened_at: string | null;
};

const COLUMNS = 'id, body, created_at, opened_at';

/** 최신 쪽지부터 limit개. 오류가 나면 빈 배열 */
export async function listLetters(userId: string, limit = 20): Promise<Letter[]> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('letters')
      .select(COLUMNS)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      // 테이블이 없으면(마이그레이션 006 미실행) 여기로 온다
      console.error('[letters] 조회 오류:', error.message);
      return [];
    }
    return (data ?? []) as Letter[];
  } catch (err) {
    console.error('[letters] 조회 예외:', err);
    return [];
  }
}

/** 쪽지 1장을 저장한다. 실패하면 null */
export async function createLetter(
  userId: string,
  body: string
): Promise<Letter | null> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('letters')
      .insert({ user_id: userId, body })
      .select(COLUMNS)
      .single();

    if (error) {
      console.error('[letters] 저장 오류:', error.message);
      return null;
    }
    return (data as Letter | null) ?? null;
  } catch (err) {
    console.error('[letters] 저장 예외:', err);
    return null;
  }
}

/**
 * 쪽지를 '읽음'으로 표시한다.
 * 처음 연 시각만 남기도록 opened_at이 비어 있을 때만 갱신한다.
 */
export async function markLetterOpened(
  userId: string,
  id: string
): Promise<boolean> {
  try {
    const admin = createAdminClient();
    const { error } = await admin
      .from('letters')
      .update({ opened_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .is('opened_at', null);

    if (error) {
      console.error('[letters] 읽음 표시 오류:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[letters] 읽음 표시 예외:', err);
    return false;
  }
}
