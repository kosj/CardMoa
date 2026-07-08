import { getExchangeRates } from '@/lib/exchange';
import { getTransactions } from '@/lib/transactions';
import { PaymentTextParser } from './components/PaymentTextParser';
import { StatsDashboard } from './components/StatsDashboard';
import { TuitionForm } from './components/TuitionForm';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const [tx, exchangeRates] = await Promise.all([
    getTransactions(1000),
    getExchangeRates(),
  ]);

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
