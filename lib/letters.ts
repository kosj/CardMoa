import { createAdminClient } from '@/lib/supabase/admin';

/**
 * 아빠의 쪽지 — 대시보드 '아빠가 보낸 쪽지 💌'의 데이터 계층.
 * 서비스 롤로 읽고 쓰며, letters 테이블이 아직 없으면(마이그레이션 006 미실행)
 * 로그만 남기고 빈 값으로 물러난다. 화면이 멈추지 않는 것이 우선.
 *
 * 쪽지에 붙인 사진(memory_id)은 마이그레이션 009에서 생긴 열이다.
 * 아직 실행하지 않았으면 사진 없이 읽어서 쪽지는 그대로 보인다.
 */

export type Letter = {
  id: string;
  body: string;
  created_at: string;
  opened_at: string | null;
  /** 함께 붙인 추억 사진 (없거나, 사진이 지워졌으면 null) */
  memory_id: string | null;
};

const BASE_COLUMNS = 'id, body, created_at, opened_at';
const COLUMNS = `${BASE_COLUMNS}, memory_id`;

type BaseLetterRow = Omit<Letter, 'memory_id'>;

/**
 * memory_id 열이 없어서(마이그레이션 009 미실행) 난 오류인지.
 * 조회는 Postgres 42703(undefined_column), 저장은 PostgREST PGRST204(스키마 캐시에 열 없음)로 온다.
 */
function isMissingMemoryColumn(error: { code?: string; message?: string }): boolean {
  if (error.code === '42703' || error.code === 'PGRST204') return true;
  return /memory_id/.test(error.message ?? '');
}

function withoutPhoto(rows: BaseLetterRow[]): Letter[] {
  return rows.map((r) => ({ ...r, memory_id: null }));
}

/** 최신 쪽지부터 limit개. 오류가 나면 빈 배열 */
export async function listLetters(userId: string, limit = 20): Promise<Letter[]> {
  try {
    const admin = createAdminClient();
    const query = (columns: string) =>
      admin
        .from('letters')
        .select(columns)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

    const { data, error } = await query(COLUMNS);
    if (!error) return (data ?? []) as unknown as Letter[];

    if (isMissingMemoryColumn(error)) {
      // 마이그레이션 009 전 — 사진 없이 다시 읽는다
      const retry = await query(BASE_COLUMNS);
      if (!retry.error) {
        return withoutPhoto((retry.data ?? []) as unknown as BaseLetterRow[]);
      }
      console.error('[letters] 조회 오류:', retry.error.message);
      return [];
    }

    // 테이블이 없으면(마이그레이션 006 미실행) 여기로 온다
    console.error('[letters] 조회 오류:', error.message);
    return [];
  } catch (err) {
    console.error('[letters] 조회 예외:', err);
    return [];
  }
}

export type CreateLetterResult =
  | { ok: true; letter: Letter }
  /** missing_photo_column: 사진을 붙이려 했지만 memory_id 열이 없다 (마이그레이션 009 미실행) */
  | { ok: false; reason: 'missing_photo_column' | 'error' };

/**
 * 쪽지 1장을 저장한다. memoryId가 있으면 그 사진을 함께 붙인다.
 * (사진이 앱 사용자 것인지는 부르는 쪽에서 먼저 확인한다)
 */
export async function createLetter(
  userId: string,
  body: string,
  memoryId: string | null = null
): Promise<CreateLetterResult> {
  try {
    const admin = createAdminClient();

    if (!memoryId) {
      // 사진이 없으면 009 이전 스키마에서도 저장되도록 memory_id를 건드리지 않는다
      const { data, error } = await admin
        .from('letters')
        .insert({ user_id: userId, body })
        .select(BASE_COLUMNS)
        .single();
      if (error || !data) {
        console.error('[letters] 저장 오류:', error?.message);
        return { ok: false, reason: 'error' };
      }
      return { ok: true, letter: { ...(data as BaseLetterRow), memory_id: null } };
    }

    const { data, error } = await admin
      .from('letters')
      .insert({ user_id: userId, body, memory_id: memoryId })
      .select(COLUMNS)
      .single();
    if (error || !data) {
      console.error('[letters] 저장 오류:', error?.message);
      return {
        ok: false,
        reason: error && isMissingMemoryColumn(error) ? 'missing_photo_column' : 'error',
      };
    }
    return { ok: true, letter: data as Letter };
  } catch (err) {
    console.error('[letters] 저장 예외:', err);
    return { ok: false, reason: 'error' };
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
