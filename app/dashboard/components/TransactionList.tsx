import { CreditCard, ReceiptText } from 'lucide-react';
import { formatAmount, formatDate } from '@/lib/utils';
import type { Transaction, CardCompany } from '@/types';

const CARD_BADGE: Record<CardCompany, string> = {
  SHINHAN: 'bg-blue-100 text-blue-800',
  LOTTE: 'bg-red-100 text-red-800',
  UNKNOWN: 'bg-gray-100 text-gray-600',
};

const CARD_LABEL: Record<CardCompany, string> = {
  SHINHAN: '신한',
  LOTTE: '롯데',
  UNKNOWN: '기타',
};

interface Props {
  transactions: Transaction[];
}

export function TransactionList({ transactions }: Props) {
  const total = transactions.reduce((sum, t) => sum + t.amount, 0);

  return (
    <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <ReceiptText className="h-5 w-5 text-blue-600" />
          <h2 className="text-base font-semibold text-gray-900">결제 내역</h2>
          <span className="ml-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
            {transactions.length}건
          </span>
        </div>
        {transactions.length > 0 && (
          <p className="text-sm text-gray-500">
            합계{' '}
            <span className="font-semibold text-gray-900">
              {formatAmount(total)}
            </span>
          </p>
        )}
      </div>

      {/* 빈 상태 */}
      {transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <CreditCard className="h-14 w-14 mb-3 opacity-20" />
          <p className="text-sm font-medium">등록된 결제 내역이 없습니다.</p>
          <p className="text-xs mt-1 text-gray-400">
            위에서 결제 알림 문자를 붙여넣어 시작하세요.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  날짜 · 시간
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  카드사
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  가맹점
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  금액
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {transactions.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {formatDate(t.approved_at)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        CARD_BADGE[t.card_company] ?? CARD_BADGE.UNKNOWN
                      }`}
                    >
                      {CARD_LABEL[t.card_company] ?? '기타'}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {t.merchant}
                  </td>
                  <td className="px-6 py-4 text-right font-semibold text-gray-900 tabular-nums">
                    {formatAmount(t.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
