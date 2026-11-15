'use server';

import { revalidatePath } from 'next/cache';
import { getAppUserId } from '@/lib/app-user';
import { createLetter, markLetterOpened, type Letter } from '@/lib/letters';

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

/** 아빠의 쪽지를 저장한다. (1~500자) */
export async function sendLetter(body: string): Promise<SendLetterResult> {
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

  const userId = await getAppUserId();
  if (!userId) {
    return { success: false, error: '사용자를 찾을 수 없습니다.' };
  }

  const letter = await createLetter(userId, text);
  if (!letter) {
    return {
      success: false,
      error: '쪽지를 저장하지 못했습니다. (마이그레이션 006 실행 여부를 확인해주세요)',
    };
  }

  revalidatePath('/dashboard');
  return { success: true, letter };
}

/** 쪽지를 처음 연 시각을 기록한다. 화면 갱신은 필요 없다. */
export async function openLetter(id: string): Promise<OpenLetterResult> {
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
