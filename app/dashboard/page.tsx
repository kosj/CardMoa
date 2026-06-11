import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PaymentTextParser } from './components/PaymentTextParser';
import { TransactionList } from './components/TransactionList';
import { StatsDashboard } from './components/StatsDashboard';
import { SignOutButton } from './components/SignOutButton';
import type { Transaction } from '@/types';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  // 통계용 — 최근 1,000건 (연간 통계에 충분한 양)
  const { data: transactions, error } = await supabase
    .from('transactions')
    .select('*')
    .order('approved_at', { ascending: false })
    .limit(1000);

  if (error) {
    console.error('[dashboard] Failed to fetch transactions:', error.message);
  }

  const tx = (transactions ?? []) as Transaction[];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
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
        {/* 결제 알림 붙여넣기 */}
        <PaymentTextParser />

        {/* 연간/월간 통계 + 분포 그래프 */}
        <StatsDashboard transactions={tx} />

        {/* 결제 내역 목록 */}
        <TransactionList transactions={tx.slice(0, 100)} />
      </main>
    </div>
  );
}
