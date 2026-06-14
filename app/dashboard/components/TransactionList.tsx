'use client';

import { useState, useMemo } from 'react';
import { CreditCard, ReceiptText, ChevronLeft, ChevronRight } from 'lucide-react';
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

const CURRENCY_BADGE: Record<string, string> = {
  JPY: 'bg-orange-50 text-orange-700',
  USD: 'bg-green-50 text-green-700',
  EUR: 'bg-purple-50 text-purple-700',
  KRW: 'bg-gray-50 text-gray-600',
};

interface Props {
  transactions: Transaction[];
}

export function TransactionList({ transactions }: Props) {
  // 데이터에 있는 연-월 목록 (최신순)
  const months = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((t) => {
      const d = new Date(t.approved_at);
      set.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [transactions]);

  const [monthIdx, setMonthIdx] = useState(0);
  const selectedMonth = months[monthIdx];

  const filtered = useMemo(() => {
    if (!selectedMonth) return [];
    return transactions.filter((t) => {
      const d = new Date(t.approved_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      return key === selectedMonth;
    });
  }, [transactions, selectedMonth]);

  const label = selectedMonth
    ? `${selectedMonth.split('-')[0]}년 ${Number(selectedMonth.split('-')[1])}월`
    : '-';

  return (
    <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <ReceiptText className="h-5 w-5 text-blue-600" />
          <h2 className="text-base font-semibold text-gray-900">결제 내역</h2>
          <span className="ml-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
            {filtered.length}건
          </span>
        </div>

        {/* 월 네비게이션 */}
        {months.length > 0 && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setMonthIdx((i) => Math.min(i + 1, months.length - 1))}
              disabled={monthIdx >= months.length - 1}
              className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 transition-colors"
              aria-label="이전 달"
            >
              <ChevronLeft className="h-4 w-4 text-gray-600" />
            </button>
            <span className="text-sm font-medium text-gray-700 w-28 text-center">
              {label}
            </span>
            <button
              onClick={() => setMonthIdx((i) => Math.max(i - 1, 0))}
              disabled={monthIdx <= 0}
              className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 transition-colors"
              aria-label="다음 달"
            >
              <ChevronRight className="h-4 w-4 text-gray-600" />
            </button>
          </div>
        )}
      </div>

      {/* 빈 상태 */}
      {transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <CreditCard className="h-14 w-14 mb-3 opacity-20" />
          <p className="text-sm font-medium">등록된 결제 내역이 없습니다.</p>
          <p className="text-xs mt-1">아래에서 결제 알림 문자를 붙여넣어 시작하세요.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <p className="text-sm">이 달의 결제 내역이 없습니다.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">날짜 · 시간</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">카드사</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">가맹점</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">금액</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {formatDate(t.approved_at)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${CARD_BADGE[t.card_company] ?? CARD_BADGE.UNKNOWN}`}>
                      {CARD_LABEL[t.card_company] ?? '기타'}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">{t.merchant}</td>
                  <td className="px-6 py-4 text-right tabular-nums">
                    <span className={`mr-1.5 rounded px-1.5 py-0.5 text-xs font-medium ${CURRENCY_BADGE[t.currency] ?? CURRENCY_BADGE.KRW}`}>
                      {t.currency ?? 'KRW'}
                    </span>
                    <span className="font-semibold text-gray-900">
                      {formatAmount(t.amount, t.currency ?? 'KRW')}
                    </span>
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
