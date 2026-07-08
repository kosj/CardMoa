'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAppUserId } from '@/lib/app-user';
import { parsePaymentText } from '@/lib/parser';

export interface ParseActionResult {
  success: boolean;
  inserted: number;
  skipped: number;
  error?: string;
}

export async function parseAndSavePaymentText(
  text: string
): Promise<ParseActionResult> {
  // ① 고정 계정 확인
  const userId = await getAppUserId();
  if (!userId) {
    return { success: false, inserted: 0, skipped: 0, error: '사용자를 찾을 수 없습니다.' };
  }

  // ② 입력값 검증
  if (typeof text !== 'string' || text.trim().length === 0) {
    return { success: false, inserted: 0, skipped: 0, error: '텍스트를 입력해주세요.' };
  }
  if (text.length > 5000) {
    return { success: false, inserted: 0, skipped: 0, error: '텍스트가 너무 깁니다. (최대 5,000자)' };
  }

  // ③ 패턴 파싱
  const candidates = parsePaymentText(text.trim());

  if (candidates.length === 0) {
    return { success: true, inserted: 0, skipped: 0 };
  }

  // ④ 중복 필터링 — upsert + ignoreDuplicates (DB 유니크 제약과 함께 동작)
  const admin = createAdminClient();
  const rows = candidates.map((t) => ({ ...t, user_id: userId }));

  const { data: inserted, error: dbError } = await admin
    .from('transactions')
    .upsert(rows, {
      onConflict: 'user_id,card_company,approved_at,merchant,amount',
      ignoreDuplicates: true,
    })
    .select('id');

  if (dbError) {
    console.error('[action] DB upsert error:', dbError);
    return { success: false, inserted: 0, skipped: 0, error: '저장 중 오류가 발생했습니다.' };
  }

  const insertedCount = inserted?.length ?? 0;
  const skippedCount = candidates.length - insertedCount;

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/transactions');
  return { success: true, inserted: insertedCount, skipped: skippedCount };
}

export interface TuitionActionResult {
  success: boolean;
  error?: string;
}

/**
 * 수업료를 지출 내역에 추가한다.
 * card_company='TUITION', currency='KRW'로 저장되어 전체 통계에 합산된다.
 */
export async function addTuition(input: {
  amount: number;
  date: string; // YYYY-MM-DD
  note?: string;
}): Promise<TuitionActionResult> {
  const userId = await getAppUserId();
  if (!userId) {
    return { success: false, error: '사용자를 찾을 수 없습니다.' };
  }

  const amount = Number(input.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return { success: false, error: '금액을 올바르게 입력해주세요.' };
  }

  const dateRe = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRe.test(input.date)) {
    return { success: false, error: '날짜를 올바르게 입력해주세요.' };
  }

  const merchant = (input.note?.trim() || '수업료').slice(0, 200);
  // 정오(12:00)로 저장 — 타임존 경계에서 날짜가 밀리는 것을 방지
  const approved_at = `${input.date} 12:00:00`;

  const admin = createAdminClient();
  const { error: dbError } = await admin.from('transactions').insert({
    user_id: userId,
    card_company: 'TUITION',
    approved_at,
    merchant,
    amount,
    currency: 'KRW',
  });

  if (dbError) {
    console.error('[action] tuition insert error:', dbError);
    return { success: false, error: '저장 중 오류가 발생했습니다.' };
  }

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/transactions');
  return { success: true };
}
