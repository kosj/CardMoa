'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
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
  // ① 세션 확인
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, inserted: 0, skipped: 0, error: '로그인이 필요합니다.' };
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

  // ④ 중복 필터링 — upsert + ignoreDuplicates
  //    DB 유니크 제약(transactions_dedup_key)과 함께 동작
  //    RLS의 WITH CHECK(auth.uid() = user_id)가 권한을 보장
  const rows = candidates.map((t) => ({ ...t, user_id: user.id }));

  const { data: inserted, error: dbError } = await supabase
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
  return { success: true, inserted: insertedCount, skipped: skippedCount };
}
