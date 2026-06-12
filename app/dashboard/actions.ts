'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { parsePaymentText } from '@/lib/gemini';

export interface ParseActionResult {
  success: boolean;
  inserted: number;
  error?: string;
}

/**
 * 결제 알림 문자를 AI로 파싱한 후 DB에 저장하는 Server Action.
 * RLS 정책(user_id = auth.uid())이 DB 레벨에서 권한을 보장하므로
 * 사용자는 절대 다른 사용자의 데이터를 삽입할 수 없다.
 */
export async function parseAndSavePaymentText(
  text: string
): Promise<ParseActionResult> {
  // ① 세션 확인 — getUser()는 JWT를 직접 검증하므로 세션 위조 불가
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, inserted: 0, error: '로그인이 필요합니다.' };
  }

  // ② 입력값 검증
  if (typeof text !== 'string' || text.trim().length === 0) {
    return { success: false, inserted: 0, error: '텍스트를 입력해주세요.' };
  }
  if (text.length > 2000) {
    return {
      success: false,
      inserted: 0,
      error: '텍스트가 너무 깁니다. (최대 2,000자)',
    };
  }

  // ③ AI 파싱
  let transactions;
  try {
    transactions = await parsePaymentText(text.trim());
  } catch (err) {
    console.error('[action] AI parse error:', err);
    const detail =
      err instanceof Error ? err.message : '알 수 없는 오류';
    return {
      success: false,
      inserted: 0,
      error: `AI 분석 중 오류가 발생했습니다: ${detail}`,
    };
  }

  if (transactions.length === 0) {
    return { success: true, inserted: 0 };
  }

  // ④ INSERT — anon 클라이언트 사용 + RLS가 user_id 일치 여부를 강제함
  const rows = transactions.map((t) => ({ ...t, user_id: user.id }));
  const { error: dbError } = await supabase.from('transactions').insert(rows);

  if (dbError) {
    console.error('[action] DB insert error:', dbError);
    return { success: false, inserted: 0, error: '저장 중 오류가 발생했습니다.' };
  }

  // ⑤ 대시보드 캐시 무효화 → 서버 컴포넌트 자동 갱신
  revalidatePath('/dashboard');

  return { success: true, inserted: transactions.length };
}
