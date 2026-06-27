import { createClient } from '@/lib/supabase/server';
import { TransactionList } from '../components/TransactionList';
import type { Transaction } from '@/types';

export const dynamic = 'force-dynamic';

export default async function TransactionsPage() {
  const supabase = createClient();

  const { data: transactions, error } = await supabase
    .from('transactions')
    .select('*')
    .order('approved_at', { ascending: false })
    .limit(2000);

  if (error) {
    console.error('[transactions] Failed to fetch transactions:', error.message);
  }

  const tx = (transactions ?? []) as Transaction[];

  return (
    <main className="mx-auto max-w-4xl px-4 sm:px-6 py-8 space-y-6">
      <TransactionList transactions={tx} />
    </main>
  );
}
