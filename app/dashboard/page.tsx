import { getExchangeRates } from '@/lib/exchange';
import { getAppIncludeDomestic } from '@/lib/settings';
import { getTransactions } from '@/lib/transactions';
import { DadLetterSection } from './components/DadLetterSection';
import { PaymentTextParser } from './components/PaymentTextParser';
import { SpendingCoach } from './components/SpendingCoach';
import { StatsDashboard } from './components/StatsDashboard';
import { TuitionForm } from './components/TuitionForm';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const [tx, exchangeRates, includeDomestic] = await Promise.all([
    getTransactions(1000),
    getExchangeRates(),
    getAppIncludeDomestic(),
  ]);

  return (
    <main className="mx-auto max-w-4xl px-4 sm:px-6 py-8 space-y-6">
      {/* 아빠가 보낸 쪽지 — 대시보드에서 가장 먼저 보이는 자리 */}
      <DadLetterSection />

      {/* 미쿠의 이번 달 안부 */}
      <SpendingCoach transactions={tx} exchangeRates={exchangeRates} />

      {/* 생활비 통계 */}
      <StatsDashboard transactions={tx} exchangeRates={exchangeRates} />

      {/* 아빠가 쓰는 입력 도구 — 담백하게 아래쪽에 */}
      <TuitionForm />

      <PaymentTextParser includeDomestic={includeDomestic} />
    </main>
  );
}
