import { createClient } from '@/lib/supabase/server';
import { getExchangeRates } from '@/lib/exchange';
import { PaymentTextParser } from './components/PaymentTextParser';
import { StatsDashboard } from './components/StatsDashboard';
import { TuitionForm } from './components/TuitionForm';
import type { Transaction } from '@/types';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = createClient();

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
    <main className="mx-auto max-w-4xl px-4 sm:px-6 py-8 space-y-6">
      {/* 통계 */}
      <StatsDashboard transactions={tx} exchangeRates={exchangeRates} />

      {/* 수업료 입력 */}
      <TuitionForm />

      {/* 결제 알림 붙여넣기 */}
      <PaymentTextParser />
    </main>
  );
}
