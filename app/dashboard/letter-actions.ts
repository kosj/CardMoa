'use server';

import { assertFamilyAccess } from '@/lib/family-gate';
import { revalidatePath } from 'next/cache';
import { getAppUserId } from '@/lib/app-user';
import { createLetter, markLetterOpened, type Letter } from '@/lib/letters';
import { getMemoryRow } from '@/lib/memories';

export interface SendLetterResult {
  success: boolean;
  letter?: Letter;
  error?: string;
}

export interface OpenLetterResult {
  success: boolean;
  error?: string;
}

const MAX_LETTER_LENGTH = 500;

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * 아빠의 쪽지를 저장한다. (1~500자)
 * memoryId를 주면 '우리 이야기'의 사진 한 장을 함께 붙인다 — 앱 사용자의 사진만.
 */
export async function sendLetter(
  body: string,
  memoryId?: string | null
): Promise<SendLetterResult> {
  await assertFamilyAccess();
  if (typeof body !== 'string') {
    return { success: false, error: '쪽지 내용을 입력해주세요.' };
  }

  const text = body.trim();
  // DB의 char_length와 같은 기준(코드 포인트)으로 센다
  const length = Array.from(text).length;
  if (length === 0) {
    return { success: false, error: '쪽지 내용을 입력해주세요.' };
  }
  if (length > MAX_LETTER_LENGTH) {
    return {
      success: false,
      error: `쪽지가 너무 깁니다. (최대 ${MAX_LETTER_LENGTH}자)`,
    };
  }

  const photoId = memoryId ?? null;
  if (photoId !== null && (typeof photoId !== 'string' || !UUID_REGEX.test(photoId))) {
    return { success: false, error: '붙일 사진이 올바르지 않습니다.' };
  }

  const userId = await getAppUserId();
  if (!userId) {
    return { success: false, error: '사용자를 찾을 수 없습니다.' };
  }

  if (photoId !== null) {
    // 앱 사용자의 사진인지 확인한다 (다른 사람의 사진 id는 붙일 수 없다)
    const row = await getMemoryRow(userId, photoId);
    if (row === 'error') {
      return {
        success: false,
        error: '사진을 확인하지 못했습니다. 잠시 후 다시 시도해주세요.',
      };
    }
    if (!row) {
      return {
        success: false,
        error: '붙일 사진을 찾을 수 없습니다. (이미 지워졌을 수 있어요)',
      };
    }
  }

  const saved = await createLetter(userId, text, photoId);
  if (!saved.ok) {
    return {
      success: false,
      error:
        saved.reason === 'missing_photo_column'
          ? '사진을 붙이지 못했습니다. (마이그레이션 009 실행 여부를 확인해주세요)'
          : '쪽지를 저장하지 못했습니다. (마이그레이션 006 실행 여부를 확인해주세요)',
    };
  }

  revalidatePath('/dashboard');
  return { success: true, letter: saved.letter };
}

/** 쪽지를 처음 연 시각을 기록한다. 화면 갱신은 필요 없다. */
export async function openLetter(id: string): Promise<OpenLetterResult> {
  await assertFamilyAccess();
  if (typeof id !== 'string' || !UUID_REGEX.test(id)) {
    return { success: false, error: '잘못된 요청입니다.' };
  }

  const userId = await getAppUserId();
  if (!userId) {
    return { success: false, error: '사용자를 찾을 수 없습니다.' };
  }

  const ok = await markLetterOpened(userId, id);
  if (!ok) {
    return { success: false, error: '읽음 표시를 저장하지 못했습니다.' };
  }
  return { success: true };
}
