import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PaymentTextParser } from './components/PaymentTextParser';
import { TransactionList } from './components/TransactionList';
import { SignOutButton } from './components/SignOutButton';
import type { Transaction } from '@/types';

export default async function DashboardPage() {
  const supabase = createClient();

  // getUser()는 Supabase 서버에서 JWT를 직접 검증하므로 위변조 불가
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  const { data: transactions, error } = await supabase
    .from('transactions')
    .select('*')
    .order('approved_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('[dashboard] Failed to fetch transactions:', error.message);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-gray-200">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-base font-bold text-gray-900">CardMoa</p>
            <p className="text-xs text-gray-400">{user.email}</p>
          </div>
          <SignOutButton />
        </div>
      </header>

      {/* 메인 */}
      <main className="mx-auto max-w-3xl px-4 sm:px-6 py-8 space-y-6">
        {/* 결제 문자 파싱 컴포넌트 */}
        <PaymentTextParser />

        {/* 저장된 결제 내역 목록
            revalidatePath('/dashboard')가 호출되면 이 서버 컴포넌트가 자동 갱신됨 */}
        <TransactionList transactions={(transactions ?? []) as Transaction[]} />
      </main>
    </div>
  );
}
