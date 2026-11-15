import { createAdminClient } from '@/lib/supabase/admin';
import type { Memory } from '@/lib/memory-types';

/**
 * 추억 사진 — '우리 이야기' 앨범의 데이터 계층. (서버 전용)
 *
 * 사진 파일은 비공개 버킷 'memories'에, 정보는 memories 테이블에 있다.
 * 서비스 롤로만 읽고 쓰며, 브라우저에는 1시간짜리 서명 URL만 내려보낸다.
 * 테이블·버킷이 아직 없으면(마이그레이션 007 미실행) 로그만 남기고 빈 값으로 물러난다.
 */

export const MEMORY_BUCKET = 'memories';
/** 서명 URL 유효 시간(초) — Memory.url / thumb_url */
const SIGNED_URL_TTL = 3600;

/** memories 테이블 한 행 (user_id·created_at 제외) */
export interface MemoryRow {
  id: string;
  taken_at: string;
  caption: string;
  chapter: string;
  storage_path: string;
  thumb_path: string;
  width: number;
  height: number;
}

const COLUMNS = 'id, taken_at, caption, chapter, storage_path, thumb_path, width, height';

export type MemoryWriteResult = 'ok' | 'not_found' | 'error';

/**
 * 찍은 시각 오름차순으로 사진 목록을 읽고, 큰 사진·썸네일의 서명 URL을
 * 한 번의 요청으로 만들어 붙인다. 오류가 나면 빈 배열.
 */
export async function listMemoriesWithUrls(userId: string): Promise<Memory[]> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('memories')
      .select(COLUMNS)
      .eq('user_id', userId)
      .order('taken_at', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      // 테이블이 없으면(마이그레이션 007 미실행) 여기로 온다
      console.error('[memories] 조회 오류:', error.message);
      return [];
    }

    const rows = (data ?? []) as MemoryRow[];
    if (rows.length === 0) return [];

    const paths = rows.flatMap((r) => [r.storage_path, r.thumb_path]);
    const { data: signed, error: signError } = await admin.storage
      .from(MEMORY_BUCKET)
      .createSignedUrls(paths, SIGNED_URL_TTL);

    if (signError || !signed) {
      console.error('[memories] 서명 URL 오류:', signError?.message);
      return [];
    }

    const urlByPath = new Map<string, string>();
    for (const s of signed) {
      if (s.path && s.signedUrl && !s.error) urlByPath.set(s.path, s.signedUrl);
    }

    const memories: Memory[] = [];
    let missing = 0;
    for (const r of rows) {
      const url = urlByPath.get(r.storage_path);
      const thumbUrl = urlByPath.get(r.thumb_path);
      if (!url || !thumbUrl) {
        // 파일이 없는 행은 깨진 이미지 대신 건너뛴다
        missing++;
        continue;
      }
      memories.push({
        id: r.id,
        taken_at: r.taken_at,
        caption: r.caption ?? '',
        chapter: r.chapter ?? '',
        width: r.width,
        height: r.height,
        url,
        thumb_url: thumbUrl,
      });
    }
    if (missing > 0) {
      console.error(`[memories] 파일을 찾지 못한 사진 ${missing}장을 건너뜀`);
    }
    return memories;
  } catch (err) {
    console.error('[memories] 조회 예외:', err);
    return [];
  }
}

/** 지금까지 쓴 장(章) 이름 — 찍은 순서대로, 중복·빈 값 제외 */
export async function listMemoryChapters(userId: string): Promise<string[]> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('memories')
      .select('chapter')
      .eq('user_id', userId)
      .order('taken_at', { ascending: true });

    if (error) {
      console.error('[memories] 장 이름 조회 오류:', error.message);
      return [];
    }
    const seen = new Set<string>();
    for (const r of (data ?? []) as { chapter: string }[]) {
      if (r.chapter) seen.add(r.chapter);
    }
    return Array.from(seen);
  } catch (err) {
    console.error('[memories] 장 이름 조회 예외:', err);
    return [];
  }
}

/** 사진 1장의 정보. 없으면 null, 조회 오류면 'error' */
export async function getMemoryRow(
  userId: string,
  id: string
): Promise<MemoryRow | null | 'error'> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('memories')
      .select(COLUMNS)
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('[memories] 1장 조회 오류:', error.message);
      return 'error';
    }
    return (data as MemoryRow | null) ?? null;
  } catch (err) {
    console.error('[memories] 1장 조회 예외:', err);
    return 'error';
  }
}

/** 사진 파일 경로 — 앱 사용자 폴더 아래 uuid 이름 */
export function memoryPaths(userId: string, id: string) {
  return {
    storage_path: `${userId}/${id}.webp`,
    thumb_path: `${userId}/${id}_thumb.webp`,
  };
}

/**
 * 큰 사진·썸네일(WebP)을 비공개 버킷에 올린다. 덮어쓰지 않는다. (upsert: false)
 * 하나라도 실패하면 이미 올라간 쪽을 지우고 null.
 */
export async function uploadMemoryFiles(
  userId: string,
  id: string,
  full: ArrayBuffer,
  thumb: ArrayBuffer
): Promise<{ storage_path: string; thumb_path: string } | null> {
  const paths = memoryPaths(userId, id);
  try {
    const bucket = createAdminClient().storage.from(MEMORY_BUCKET);
    const options = { contentType: 'image/webp', upsert: false } as const;
    const [fullRes, thumbRes] = await Promise.all([
      bucket.upload(paths.storage_path, full, options),
      bucket.upload(paths.thumb_path, thumb, options),
    ]);

    if (fullRes.error || thumbRes.error) {
      // 버킷이 없으면(마이그레이션 007 미실행) 여기로 온다
      console.error(
        '[memories] 파일 올리기 오류:',
        fullRes.error?.message ?? thumbRes.error?.message
      );
      const uploaded = [
        fullRes.error ? null : paths.storage_path,
        thumbRes.error ? null : paths.thumb_path,
      ].filter((p): p is string => p !== null);
      if (uploaded.length > 0) await removeMemoryFiles(uploaded);
      return null;
    }
    return paths;
  } catch (err) {
    console.error('[memories] 파일 올리기 예외:', err);
    await removeMemoryFiles([paths.storage_path, paths.thumb_path]);
    return null;
  }
}

/** 버킷에서 파일을 지운다. (없는 파일은 조용히 넘어간다) */
export async function removeMemoryFiles(paths: string[]): Promise<boolean> {
  if (paths.length === 0) return true;
  try {
    const { error } = await createAdminClient().storage.from(MEMORY_BUCKET).remove(paths);
    if (error) {
      console.error('[memories] 파일 삭제 오류:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[memories] 파일 삭제 예외:', err);
    return false;
  }
}

/** 사진 정보를 저장한다. 실패하면 false */
export async function insertMemoryRow(userId: string, row: MemoryRow): Promise<boolean> {
  try {
    const admin = createAdminClient();
    const { error } = await admin.from('memories').insert({ ...row, user_id: userId });
    if (error) {
      console.error('[memories] 저장 오류:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[memories] 저장 예외:', err);
    return false;
  }
}

/** 캡션·장 이름을 고친다 */
export async function updateMemoryRow(
  userId: string,
  id: string,
  patch: { caption: string; chapter: string }
): Promise<MemoryWriteResult> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('memories')
      .update({ caption: patch.caption, chapter: patch.chapter })
      .eq('id', id)
      .eq('user_id', userId)
      .select('id');

    if (error) {
      console.error('[memories] 고치기 오류:', error.message);
      return 'error';
    }
    return data && data.length > 0 ? 'ok' : 'not_found';
  } catch (err) {
    console.error('[memories] 고치기 예외:', err);
    return 'error';
  }
}

/**
 * 사진을 지운다 — 파일을 먼저 지우고 행을 지운다.
 * (행만 남으면 다시 지우기로 정리할 수 있지만, 파일만 남으면 찾을 길이 없다)
 */
export async function deleteMemoryWithFiles(
  userId: string,
  id: string
): Promise<MemoryWriteResult> {
  const row = await getMemoryRow(userId, id);
  if (row === 'error') return 'error';
  if (!row) return 'not_found';

  const removed = await removeMemoryFiles([row.storage_path, row.thumb_path]);
  if (!removed) return 'error';

  try {
    const admin = createAdminClient();
    const { error } = await admin
      .from('memories')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('[memories] 삭제 오류:', error.message);
      return 'error';
    }
    return 'ok';
  } catch (err) {
    console.error('[memories] 삭제 예외:', err);
    return 'error';
  }
}
