'use server';

import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';
import { getAppUserId } from '@/lib/app-user';
import { MEMORY_FULL_MAX_BYTES, MEMORY_THUMB_MAX_BYTES } from '@/lib/image-pipeline';
import {
  deleteMemoryWithFiles,
  getMemoryRow,
  insertMemoryRow,
  removeMemoryFiles,
  updateMemoryRow,
  uploadMemoryFiles,
} from '@/lib/memories';
import {
  MEMORY_CAPTION_MAX,
  MEMORY_CHAPTER_MAX,
  MEMORY_FULL_EDGE,
  defaultChapter,
} from '@/lib/memory-types';

export interface MemoryActionResult {
  success: boolean;
  error?: string;
}

const SAVE_ERROR = '사진을 저장하지 못했습니다. (마이그레이션 007 실행 여부를 확인해주세요)';
const BAD_REQUEST = '잘못된 요청입니다.';
const NO_USER = '사용자를 찾을 수 없습니다.';
const NOT_FOUND = '사진을 찾을 수 없습니다. (이미 지워졌을 수 있어요)';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** 찍은 시각으로 받을 수 있는 범위 — 오래된 가족 사진부터 내일까지 (시간대 여유) */
const TAKEN_AT_MIN = Date.UTC(1900, 0, 1);
const TAKEN_AT_FUTURE_SLACK_MS = 2 * 24 * 60 * 60 * 1000;

function revalidateMemoryPages() {
  revalidatePath('/dashboard/memories');
  revalidatePath('/dashboard/transactions');
}

/** DB의 char_length와 같은 기준(코드 포인트)으로 센다 */
function charLength(s: string): number {
  return Array.from(s).length;
}

/** 줄바꿈·연속 공백을 한 칸으로 (캡션·장 이름은 한 줄) */
function oneLine(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  return value.replace(/\s+/g, ' ').trim();
}

type TextResult = { caption: string; chapter: string } | { error: string };

function validateText(captionRaw: unknown, chapterRaw: unknown): TextResult {
  const caption = oneLine(captionRaw ?? '');
  const chapter = oneLine(chapterRaw ?? '');
  if (caption === null || chapter === null) return { error: BAD_REQUEST };
  if (charLength(caption) > MEMORY_CAPTION_MAX) {
    return { error: `캡션이 너무 깁니다. (최대 ${MEMORY_CAPTION_MAX}자)` };
  }
  if (charLength(chapter) > MEMORY_CHAPTER_MAX) {
    return { error: `장 이름이 너무 깁니다. (최대 ${MEMORY_CHAPTER_MAX}자)` };
  }
  return { caption, chapter };
}

function isBlob(v: FormDataEntryValue | null): v is File {
  return (
    typeof v === 'object' &&
    v !== null &&
    typeof (v as Blob).arrayBuffer === 'function' &&
    typeof (v as Blob).size === 'number'
  );
}

/** 'RIFF' .... 'WEBP' — 확장자·MIME만 믿지 않고 실제 바이트를 본다 */
function isWebp(bytes: ArrayBuffer): boolean {
  if (bytes.byteLength < 12) return false;
  const b = new Uint8Array(bytes, 0, 12);
  const tag = (o: number) => String.fromCharCode(b[o], b[o + 1], b[o + 2], b[o + 3]);
  return tag(0) === 'RIFF' && tag(8) === 'WEBP';
}

async function readWebp(
  value: FormDataEntryValue | null,
  maxBytes: number,
  label: string
): Promise<ArrayBuffer | { error: string }> {
  if (!isBlob(value) || value.size === 0) return { error: '사진 파일이 없습니다.' };
  if (value.size > maxBytes) {
    const limit = maxBytes >= 1024 * 1024 ? `${maxBytes / 1024 / 1024}MB` : `${maxBytes / 1024}KB`;
    return { error: `${label}이 너무 큽니다. (최대 ${limit})` };
  }
  if (value.type && value.type !== 'image/webp') {
    return { error: 'WebP 형식의 사진만 올릴 수 있습니다.' };
  }
  const bytes = await value.arrayBuffer();
  if (!isWebp(bytes)) return { error: 'WebP 형식의 사진만 올릴 수 있습니다.' };
  return bytes;
}

function readDimension(value: FormDataEntryValue | null): number | null {
  if (typeof value !== 'string') return null;
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= MEMORY_FULL_EDGE ? n : null;
}

/**
 * 추억 사진 1장을 올린다. (브라우저에서 이미 WebP로 줄이고 메타데이터를 지운 상태)
 * 필드: full, thumb (WebP Blob), taken_at (ISO), caption, chapter, width, height
 */
export async function uploadMemory(formData: FormData): Promise<MemoryActionResult> {
  if (!(formData instanceof FormData)) return { success: false, error: BAD_REQUEST };

  const full = await readWebp(formData.get('full'), MEMORY_FULL_MAX_BYTES, '사진');
  if ('error' in full) return { success: false, error: full.error };
  const thumb = await readWebp(formData.get('thumb'), MEMORY_THUMB_MAX_BYTES, '썸네일');
  if ('error' in thumb) return { success: false, error: thumb.error };

  const takenRaw = formData.get('taken_at');
  const takenMs = typeof takenRaw === 'string' ? Date.parse(takenRaw) : NaN;
  if (
    !Number.isFinite(takenMs) ||
    takenMs < TAKEN_AT_MIN ||
    takenMs > Date.now() + TAKEN_AT_FUTURE_SLACK_MS
  ) {
    return { success: false, error: '찍은 날짜가 올바르지 않습니다.' };
  }
  const takenAt = new Date(takenMs).toISOString();

  const text = validateText(formData.get('caption'), formData.get('chapter'));
  if ('error' in text) return { success: false, error: text.error };

  const width = readDimension(formData.get('width'));
  const height = readDimension(formData.get('height'));
  if (width === null || height === null) {
    return { success: false, error: '사진 크기 정보가 올바르지 않습니다.' };
  }

  const userId = await getAppUserId();
  if (!userId) return { success: false, error: NO_USER };

  const id = randomUUID();
  const stored = await uploadMemoryFiles(userId, id, full, thumb);
  if (!stored) return { success: false, error: SAVE_ERROR };

  const inserted = await insertMemoryRow(userId, {
    id,
    taken_at: takenAt,
    caption: text.caption,
    chapter: text.chapter || defaultChapter(takenAt),
    width,
    height,
    ...stored,
  });
  if (!inserted) {
    // 정보 저장에 실패하면 올린 파일을 남기지 않는다
    await removeMemoryFiles([stored.storage_path, stored.thumb_path]);
    return { success: false, error: SAVE_ERROR };
  }

  revalidateMemoryPages();
  return { success: true };
}

/** 캡션·장 이름을 고친다. 장 이름을 비우면 찍은 달('2026년 4월')로 돌아간다 */
export async function updateMemory(
  id: string,
  input: { caption: string; chapter: string }
): Promise<MemoryActionResult> {
  if (typeof id !== 'string' || !UUID_REGEX.test(id) || typeof input !== 'object' || !input) {
    return { success: false, error: BAD_REQUEST };
  }
  const text = validateText(input.caption, input.chapter);
  if ('error' in text) return { success: false, error: text.error };

  const userId = await getAppUserId();
  if (!userId) return { success: false, error: NO_USER };

  let chapter = text.chapter;
  if (!chapter) {
    const row = await getMemoryRow(userId, id);
    if (row === 'error') return { success: false, error: '사진 정보를 고치지 못했습니다.' };
    if (!row) return { success: false, error: NOT_FOUND };
    chapter = defaultChapter(row.taken_at);
  }

  const result = await updateMemoryRow(userId, id, { caption: text.caption, chapter });
  if (result === 'not_found') return { success: false, error: NOT_FOUND };
  if (result === 'error') return { success: false, error: '사진 정보를 고치지 못했습니다.' };

  revalidateMemoryPages();
  return { success: true };
}

/** 사진을 보관함과 목록에서 지운다. (되돌릴 수 없음) */
export async function deleteMemory(id: string): Promise<MemoryActionResult> {
  if (typeof id !== 'string' || !UUID_REGEX.test(id)) {
    return { success: false, error: BAD_REQUEST };
  }

  const userId = await getAppUserId();
  if (!userId) return { success: false, error: NO_USER };

  const result = await deleteMemoryWithFiles(userId, id);
  if (result === 'not_found') return { success: false, error: NOT_FOUND };
  if (result === 'error') return { success: false, error: '사진을 지우지 못했습니다.' };

  revalidateMemoryPages();
  return { success: true };
}
