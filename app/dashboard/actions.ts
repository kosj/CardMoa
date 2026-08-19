'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAppUserId } from '@/lib/app-user';
import { applyDomesticSetting, parsePaymentText } from '@/lib/parser';
import { getIncludeDomestic, setIncludeDomestic } from '@/lib/settings';

export interface ParseActionResult {
  success: boolean;
  inserted: number;
  skipped: number;
  /** '국내 결제 포함'이 꺼져 있어 저장하지 않은 원화 결제 건수 */
  excludedDomestic: number;
  error?: string;
}

const fail = (error: string): ParseActionResult => ({
  success: false,
  inserted: 0,
  skipped: 0,
  excludedDomestic: 0,
  error,
});

export async function parseAndSavePaymentText(
  text: string
): Promise<ParseActionResult> {
  // ① 고정 계정 확인
  const userId = await getAppUserId();
  if (!userId) {
    return fail('사용자를 찾을 수 없습니다.');
  }

  // ② 입력값 검증
  if (typeof text !== 'string' || text.trim().length === 0) {
    return fail('텍스트를 입력해주세요.');
  }
  if (text.length > 5000) {
    return fail('텍스트가 너무 깁니다. (최대 5,000자)');
  }

  // ③ 패턴 파싱 — 국내(원화) 건은 저장된 설정에 따라 제외
  const includeDomestic = await getIncludeDomestic(userId);
  const parsed = parsePaymentText(text.trim());
  const candidates = applyDomesticSetting(parsed, includeDomestic);
  const excludedDomestic = parsed.length - candidates.length;

  if (candidates.length === 0) {
    return { success: true, inserted: 0, skipped: 0, excludedDomestic };
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
    return fail('저장 중 오류가 발생했습니다.');
  }

  const insertedCount = inserted?.length ?? 0;
  const skippedCount = candidates.length - insertedCount;

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/transactions');
  return {
    success: true,
    inserted: insertedCount,
    skipped: skippedCount,
    excludedDomestic,
  };
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
  // 정오(12:00) KST로 저장 — 타임존 경계에서 날짜가 밀리는 것을 방지
  const approved_at = `${input.date} 12:00:00+09:00`;

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

export interface SettingActionResult {
  success: boolean;
  error?: string;
}

/**
 * '국내(원화) 결제 포함' 설정을 저장한다.
 * 붙여넣기 UI와 웹훅이 함께 참조하므로 브라우저가 아닌 DB에 둔다.
 */
export async function updateIncludeDomestic(
  value: boolean
): Promise<SettingActionResult> {
  const userId = await getAppUserId();
  if (!userId) {
    return { success: false, error: '사용자를 찾을 수 없습니다.' };
  }

  const saved = await setIncludeDomestic(userId, value);
  if (!saved) {
    return {
      success: false,
      error: '설정을 저장하지 못했습니다. (마이그레이션 005 실행 여부를 확인해주세요)',
    };
  }

  revalidatePath('/dashboard');
  return { success: true };
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** 잘못 등록된 결제 내역 1건을 삭제한다. */
export async function deleteTransaction(
  id: string
): Promise<SettingActionResult> {
  const userId = await getAppUserId();
  if (!userId) {
    return { success: false, error: '사용자를 찾을 수 없습니다.' };
  }
  if (typeof id !== 'string' || !UUID_REGEX.test(id)) {
    return { success: false, error: '잘못된 요청입니다.' };
  }

  const admin = createAdminClient();
  const { error: dbError } = await admin
    .from('transactions')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (dbError) {
    console.error('[action] transaction delete error:', dbError);
    return { success: false, error: '삭제 중 오류가 발생했습니다.' };
  }

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/transactions');
  return { success: true };
}
