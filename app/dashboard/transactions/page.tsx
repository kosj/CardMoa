import { getExchangeRates } from '@/lib/exchange';
import { getTransactions } from '@/lib/transactions';
import { TransactionList } from '../components/TransactionList';

export const dynamic = 'force-dynamic';

export default async function TransactionsPage() {
  const [tx, exchangeRates] = await Promise.all([
    getTransactions(2000),
    getExchangeRates(),
  ]);

  return (
    <main className="mx-auto max-w-4xl px-4 sm:px-6 py-8 space-y-6">
      <TransactionList transactions={tx} exchangeRates={exchangeRates} />
    </main>
  );
}
