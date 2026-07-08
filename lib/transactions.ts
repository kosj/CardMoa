import { createAdminClient } from '@/lib/supabase/admin';
import { getAppUserId } from '@/lib/app-user';
import type { Transaction } from '@/types';

/**
 * 고정 계정의 결제 내역을 서비스 롤로 조회한다. (로그인 불필요)
 */
export async function getTransactions(limit = 1000): Promise<Transaction[]> {
  const userId = await getAppUserId();
  if (!userId) return [];

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('approved_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[transactions] 조회 오류:', error.message);
    return [];
  }
  return (data ?? []) as Transaction[];
}
