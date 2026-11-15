import { getAppUserId } from '@/lib/app-user';
import { getExchangeRates } from '@/lib/exchange';
import { listMemoriesWithUrls } from '@/lib/memories';
import type { Memory } from '@/lib/memory-types';
import { getTransactions } from '@/lib/transactions';
import { TransactionList } from '../components/TransactionList';

export const dynamic = 'force-dynamic';

/** 생활 기록에서 사진은 곁들임 — 불러오지 못해도 내역은 그대로 보여 준다 */
async function loadMemories(): Promise<Memory[]> {
  try {
    const userId = await getAppUserId();
    return userId ? await listMemoriesWithUrls(userId) : [];
  } catch (err) {
    console.error('[transactions] 추억 사진 조회 오류:', err);
    return [];
  }
}

export default async function TransactionsPage() {
  const [tx, exchangeRates, memories] = await Promise.all([
    getTransactions(2000),
    getExchangeRates(),
    loadMemories(),
  ]);

  return (
    <main className="mx-auto max-w-4xl px-4 sm:px-6 py-8 space-y-6">
      <TransactionList transactions={tx} exchangeRates={exchangeRates} memories={memories} />
    </main>
  );
}
