'use server';

import { assertFamilyAccess } from '@/lib/family-gate';
import { revalidatePath } from 'next/cache';
import { getAppUserId } from '@/lib/app-user';
import { getMemoryRow } from '@/lib/memories';
import { setMikuMemoryId } from '@/lib/settings';

/**
 * 미쿠 카드 — 미쿠를 누르면 뒤집혀 보이는 사진을 고른다. (아빠의 도구)
 * 어떤 사진을 보여줄지는 가족이 직접 정한다. 코드는 사진을 가정하지 않는다.
 */

export interface MikuActionResult {
  success: boolean;
  error?: string;
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const fail = (error: string): MikuActionResult => ({ success: false, error });

/** memoryId가 null이면 '사진 없이' — 미쿠는 뒤집히지 않고 간지럼만 탄다 */
export async function updateMikuMemory(memoryId: string | null): Promise<MikuActionResult> {
  await assertFamilyAccess();

  if (memoryId !== null && (typeof memoryId !== 'string' || !UUID_REGEX.test(memoryId))) {
    return fail('잘못된 요청입니다.');
  }

  const userId = await getAppUserId();
  if (!userId) return fail('사용자를 찾을 수 없습니다.');

  // 앱 사용자의 사진인지 확인한 뒤에만 연결한다
  if (memoryId !== null) {
    const row = await getMemoryRow(userId, memoryId);
    if (row === 'error') return fail('사진을 확인하지 못했습니다. 잠시 후 다시 시도해주세요.');
    if (!row) return fail('사진을 찾을 수 없습니다. (이미 지워졌을 수 있어요)');
  }

  const saved = await setMikuMemoryId(userId, memoryId);
  if (!saved) {
    return fail('미쿠 카드 사진을 저장하지 못했습니다. (마이그레이션 009 실행 여부를 확인해주세요)');
  }

  revalidatePath('/dashboard');
  return { success: true };
}
