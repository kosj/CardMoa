import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PaymentTextParser } from './components/PaymentTextParser';
import { TransactionList } from './components/TransactionList';
import { StatsDashboard } from './components/StatsDashboard';
import { SignOutButton } from './components/SignOutButton';
import type { Transaction } from '@/types';

export const dynamic = 'force-dynamic';

/** KRW 기준 환율 조회 (1 외화 = X 원). 1시간 캐시. */
async function getExchangeRates(): Promise<Record<string, number>> {
  try {
    const res = await fetch(
      'https://api.frankfurter.app/latest?from=KRW&to=JPY,USD,EUR,GBP,CNY,HKD,THB',
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return {};
    const data = (await res.json()) as { rates: Record<string, number> };
    // data.rates: 1 KRW = X 외화 → 뒤집어서 1 외화 = X 원
    const krwPer: Record<string, number> = {};
    for (const [currency, rate] of Object.entries(data.rates)) {
      krwPer[currency] = Math.round(1 / rate);
    }
    return krwPer;
  } catch {
    return {};
  }
}

export default async function DashboardPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  const [{ data: transactions, error }, exchangeRates] = await Promise.all([
    supabase
      .from('transactions')
      .select('*')
      .order('approved_at', { ascending: false })
      .limit(1000),
    getExchangeRates(),
  ]);

  if (error) {
    console.error('[dashboard] Failed to fetch transactions:', error.message);
  }

  const tx = (transactions ?? []) as Transaction[];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-gray-200">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-base font-bold text-gray-900">CardMoa</p>
            <p className="text-xs text-gray-400">{user.email}</p>
          </div>
          <SignOutButton />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 sm:px-6 py-8 space-y-6">
        {/* 통계 */}
        <StatsDashboard transactions={tx} exchangeRates={exchangeRates} />

        {/* 결제 내역 목록 */}
        <TransactionList transactions={tx.slice(0, 100)} />

        {/* 결제 알림 붙여넣기 — 하단 */}
        <PaymentTextParser />
      </main>
    </div>
  );
}
