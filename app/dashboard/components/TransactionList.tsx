'use client';

import { useState, useMemo } from 'react';
import { Heart, ReceiptText, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatAmount, formatDate, seoulDateParts } from '@/lib/utils';
import type { Transaction, CardCompany } from '@/types';

const CARD_BADGE: Record<CardCompany, string> = {
  SHINHAN: 'bg-sky-100 text-sky-700',
  LOTTE: 'bg-rose-100 text-rose-700',
  TUITION: 'bg-violet-100 text-violet-700',
  UNKNOWN: 'bg-gray-100 text-gray-600',
};

const CARD_LABEL: Record<CardCompany, string> = {
  SHINHAN: '신한',
  LOTTE: '롯데',
  TUITION: '수업료',
  UNKNOWN: '기타',
};

const CURRENCY_BADGE: Record<string, string> = {
  JPY: 'bg-orange-50 text-orange-600',
  USD: 'bg-emerald-50 text-emerald-600',
  EUR: 'bg-purple-50 text-purple-600',
  KRW: 'bg-pink-50 text-pink-600',
};

interface Props {
  transactions: Transaction[];
  exchangeRates?: Record<string, number>;
}

function toKRW(amount: number, currency: string, rates: Record<string, number>): number {
  if (currency === 'KRW') return amount;
  return Math.round(amount * (rates[currency] ?? 1));
}

export function TransactionList({ transactions, exchangeRates = {} }: Props) {
  // 데이터에 있는 연-월 목록 (최신순, KST 기준)
  const monthKey = (dateStr: string) => {
    const { year, month } = seoulDateParts(dateStr);
    return `${year}-${String(month).padStart(2, '0')}`;
  };

  const months = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((t) => set.add(monthKey(t.approved_at)));
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [transactions]);

  const [monthIdx, setMonthIdx] = useState(0);
  const selectedMonth = months[monthIdx];

  const filtered = useMemo(() => {
    if (!selectedMonth) return [];
    return transactions.filter((t) => monthKey(t.approved_at) === selectedMonth);
  }, [transactions, selectedMonth]);

  // 외화는 환율로 원화 환산해 합산
  const monthTotal = useMemo(
    () => filtered.reduce((s, t) => s + toKRW(t.amount, t.currency, exchangeRates), 0),
    [filtered, exchangeRates]
  );

  const label = selectedMonth
    ? `${selectedMonth.split('-')[0]}년 ${Number(selectedMonth.split('-')[1])}월`
    : '-';

  return (
    <section className="bg-white rounded-3xl border border-rose-100 shadow-sm shadow-rose-100/40 overflow-hidden">
      {/* 헤더 */}
      <div className="px-5 sm:px-6 py-4 border-b border-rose-50 bg-gradient-to-r from-rose-50/60 to-pink-50/60">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ReceiptText className="h-5 w-5 text-rose-400" />
            <h2 className="text-base font-bold text-gray-800">결제 내역</h2>
            <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-rose-500 border border-rose-100">
              {filtered.length}건
            </span>
          </div>

          {/* 월 네비게이션 */}
          {months.length > 0 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setMonthIdx((i) => Math.min(i + 1, months.length - 1))}
                disabled={monthIdx >= months.length - 1}
                className="p-1.5 rounded-full hover:bg-white disabled:opacity-30 transition-colors"
                aria-label="이전 달"
              >
                <ChevronLeft className="h-4 w-4 text-rose-400" />
              </button>
              <span className="text-sm font-semibold text-gray-700 w-24 sm:w-28 text-center">
                {label}
              </span>
              <button
                onClick={() => setMonthIdx((i) => Math.max(i - 1, 0))}
                disabled={monthIdx <= 0}
                className="p-1.5 rounded-full hover:bg-white disabled:opacity-30 transition-colors"
                aria-label="다음 달"
              >
                <ChevronRight className="h-4 w-4 text-rose-400" />
              </button>
            </div>
          )}
        </div>

        {filtered.length > 0 && (
          <p className="mt-2 text-xs text-gray-400">
            이 달 지출 합계 (원화 환산){' '}
            <span className="font-semibold text-rose-500">
              {formatAmount(monthTotal)}
            </span>
          </p>
        )}
      </div>

      {/* 빈 상태 */}
      {transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-300">
          <Heart className="h-12 w-12 mb-3 text-rose-100" />
          <p className="text-sm font-medium text-gray-400">아직 등록된 내역이 없어요.</p>
          <p className="text-xs mt-1 text-gray-300">결제 알림이나 수업료를 추가해 보세요.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-300">
          <p className="text-sm text-gray-400">이 달의 결제 내역이 없어요.</p>
        </div>
      ) : (
        <ul className="divide-y divide-rose-50">
          {filtered.map((t) => (
            <li
              key={t.id}
              className="flex items-center justify-between gap-3 px-5 sm:px-6 py-4 hover:bg-rose-50/40 transition-colors"
            >
              {/* 왼쪽: 카드사 · 날짜 · 가맹점 */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      CARD_BADGE[t.card_company] ?? CARD_BADGE.UNKNOWN
                    }`}
                  >
                    {CARD_LABEL[t.card_company] ?? '기타'}
                  </span>
                  <span className="text-xs text-gray-400 truncate">
                    {formatDate(t.approved_at)}
                  </span>
                </div>
                <p className="font-medium text-gray-800 truncate">{t.merchant}</p>
              </div>

              {/* 오른쪽: 금액 */}
              <div className="shrink-0 text-right">
                <p className="font-bold text-gray-900 tabular-nums whitespace-nowrap">
                  {formatAmount(t.amount, t.currency ?? 'KRW')}
                </p>
                <span
                  className={`mt-0.5 inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                    CURRENCY_BADGE[t.currency] ?? CURRENCY_BADGE.KRW
                  }`}
                >
                  {t.currency ?? 'KRW'}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
