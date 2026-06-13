'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import {
  TrendingUp, Calendar, Store, CreditCard, ChevronLeft, ChevronRight,
} from 'lucide-react';
import type { Transaction } from '@/types';
import { formatAmount } from '@/lib/utils';
import type { MonthlyData } from './MonthlyBarChart';
import type { MerchantSlice } from './MerchantPieChart';

// recharts는 SSR 비호환이므로 dynamic import
const MonthlyBarChart = dynamic(
  () => import('./MonthlyBarChart').then((m) => ({ default: m.MonthlyBarChart })),
  {
    ssr: false,
    loading: () => (
      <div className="h-60 flex items-center justify-center text-sm text-gray-400">
        차트 로딩 중…
      </div>
    ),
  }
);

const MerchantPieChart = dynamic(
  () => import('./MerchantPieChart').then((m) => ({ default: m.MerchantPieChart })),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 flex items-center justify-center text-sm text-gray-400">
        차트 로딩 중…
      </div>
    ),
  }
);

const CARD_LABEL: Record<string, string> = {
  SHINHAN: '신한카드',
  LOTTE: '롯데카드',
  UNKNOWN: '기타',
};
const CARD_COLOR: Record<string, string> = {
  SHINHAN: 'bg-blue-500',
  LOTTE: 'bg-red-500',
  UNKNOWN: 'bg-gray-400',
};

interface Props {
  transactions: Transaction[];
  exchangeRates: Record<string, number>;
}

function toKRW(amount: number, currency: string, rates: Record<string, number>): number {
  if (currency === 'KRW') return amount;
  return Math.round(amount * (rates[currency] ?? 1));
}

export function StatsDashboard({ transactions, exchangeRates }: Props) {
  const availableYears = useMemo(() => {
    const years = Array.from(
      new Set(transactions.map((t) => new Date(t.approved_at).getFullYear()))
    ).sort((a, b) => b - a);
    if (years.length === 0) years.push(new Date().getFullYear());
    return years;
  }, [transactions]);

  const [yearIdx, setYearIdx] = useState(0);
  const selectedYear = availableYears[yearIdx] ?? new Date().getFullYear();

  const yearTx = useMemo(
    () =>
      transactions.filter(
        (t) => new Date(t.approved_at).getFullYear() === selectedYear
      ),
    [transactions, selectedYear]
  );

  // ── 월별 데이터 (KRW 환산)
  const monthlyData: MonthlyData[] = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => ({
      month: `${i + 1}월`,
      total: 0,
      count: 0,
    }));
    yearTx.forEach((t) => {
      const m = new Date(t.approved_at).getMonth();
      months[m].total += toKRW(t.amount, t.currency, exchangeRates);
      months[m].count += 1;
    });
    return months;
  }, [yearTx, exchangeRates]);

  // ── 가맹점 분포 (상위 8개 + 기타, KRW 환산)
  const merchantData: MerchantSlice[] = useMemo(() => {
    const map = new Map<string, { value: number; count: number }>();
    yearTx.forEach((t) => {
      const krw = toKRW(t.amount, t.currency, exchangeRates);
      const cur = map.get(t.merchant) ?? { value: 0, count: 0 };
      map.set(t.merchant, { value: cur.value + krw, count: cur.count + 1 });
    });
    const total = yearTx.reduce((s, t) => s + toKRW(t.amount, t.currency, exchangeRates), 0);
    const sorted = Array.from(map.entries())
      .map(([name, { value, count }]) => ({
        name,
        value,
        count,
        percentage: total > 0 ? (value / total) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value);

    if (sorted.length <= 8) return sorted;

    const top = sorted.slice(0, 8);
    const rest = sorted.slice(8);
    const etcValue = rest.reduce((s, d) => s + d.value, 0);
    const etcCount = rest.reduce((s, d) => s + d.count, 0);
    top.push({
      name: '기타',
      value: etcValue,
      count: etcCount,
      percentage: total > 0 ? (etcValue / total) * 100 : 0,
    });
    return top;
  }, [yearTx, exchangeRates]);

  // ── 카드사 분포 (KRW 환산)
  const cardData = useMemo(() => {
    const total = yearTx.reduce((s, t) => s + toKRW(t.amount, t.currency, exchangeRates), 0);
    const map = new Map<string, number>();
    yearTx.forEach((t) =>
      map.set(t.card_company, (map.get(t.card_company) ?? 0) + toKRW(t.amount, t.currency, exchangeRates))
    );
    return ['SHINHAN', 'LOTTE', 'UNKNOWN']
      .map((k) => ({ key: k, amount: map.get(k) ?? 0, pct: total > 0 ? ((map.get(k) ?? 0) / total) * 100 : 0 }))
      .filter((d) => d.amount > 0);
  }, [yearTx, exchangeRates]);

  // ── 요약 통계 (KRW 환산)
  const { yearTotal, currentMonthTotal, monthlyAvg, topMerchant } = useMemo(() => {
    const yearTotal = yearTx.reduce((s, t) => s + toKRW(t.amount, t.currency, exchangeRates), 0);
    const now = new Date();
    const currentMonthTotal =
      selectedYear === now.getFullYear()
        ? yearTx
            .filter((t) => new Date(t.approved_at).getMonth() === now.getMonth())
            .reduce((s, t) => s + toKRW(t.amount, t.currency, exchangeRates), 0)
        : 0;
    const activeMonths = monthlyData.filter((m) => m.total > 0).length;
    const monthlyAvg = activeMonths > 0 ? yearTotal / activeMonths : 0;
    const topMerchant = merchantData[0]?.name ?? '-';
    return { yearTotal, currentMonthTotal, monthlyAvg, topMerchant };
  }, [yearTx, selectedYear, monthlyData, merchantData, exchangeRates]);

  const rateNote = useMemo(() => {
    const entries = Object.entries(exchangeRates);
    if (entries.length === 0) return null;
    return entries.map(([cur, rate]) => `${cur} ₩${rate.toLocaleString()}`).join(' · ');
  }, [exchangeRates]);

  if (transactions.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* 요약 카드 4개 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={<Calendar className="h-4 w-4 text-blue-500" />} label="이번 달 지출" value={formatAmount(currentMonthTotal)} />
        <StatCard icon={<TrendingUp className="h-4 w-4 text-emerald-500" />} label={`${selectedYear}년 총 지출`} value={formatAmount(yearTotal)} />
        <StatCard icon={<CreditCard className="h-4 w-4 text-violet-500" />} label="월 평균 지출" value={formatAmount(monthlyAvg)} />
        <StatCard icon={<Store className="h-4 w-4 text-amber-500" />} label="최다 가맹점" value={topMerchant} small />
      </div>
      {rateNote && (
        <p className="text-xs text-gray-400 text-right">
          환율 기준 (1시간 캐시) · {rateNote}
        </p>
      )}

      {/* 월별 지출 */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900">월별 지출</h3>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setYearIdx((i) => Math.min(i + 1, availableYears.length - 1))}
              disabled={yearIdx >= availableYears.length - 1}
              className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="h-4 w-4 text-gray-600" />
            </button>
            <span className="text-sm font-medium text-gray-700 w-12 text-center">
              {selectedYear}
            </span>
            <button
              onClick={() => setYearIdx((i) => Math.max(i - 1, 0))}
              disabled={yearIdx <= 0}
              className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="h-4 w-4 text-gray-600" />
            </button>
          </div>
        </div>
        <MonthlyBarChart data={monthlyData} year={selectedYear} />
      </div>

      {/* 가맹점 분포 + 카드사 분포 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* 가맹점 분포 */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">가맹점 분포</h3>
          <p className="text-xs text-gray-400 mb-3">{selectedYear}년 · 상위 8개</p>
          <MerchantPieChart data={merchantData} />
        </div>

        {/* 카드사 분포 */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">카드사 분포</h3>
          <p className="text-xs text-gray-400 mb-4">{selectedYear}년</p>
          {cardData.length === 0 ? (
            <p className="text-sm text-gray-400 mt-8 text-center">데이터가 없습니다.</p>
          ) : (
            <div className="space-y-3 mt-2">
              {cardData.map((d) => (
                <div key={d.key}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700">{CARD_LABEL[d.key]}</span>
                    <span className="font-medium text-gray-900">{formatAmount(d.amount)}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${CARD_COLOR[d.key]}`}
                      style={{ width: `${d.pct}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5 text-right">{d.pct.toFixed(1)}%</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  small = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  small?: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3.5">
      <div className="flex items-center gap-1.5 mb-2">
        {icon}
        <span className="text-xs text-gray-500">{label}</span>
      </div>
      <p
        className={`font-bold text-gray-900 leading-tight truncate ${
          small ? 'text-sm' : 'text-base'
        }`}
      >
        {value}
      </p>
    </div>
  );
}
