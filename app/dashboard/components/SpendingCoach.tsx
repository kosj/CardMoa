'use client';

import { useEffect, useMemo, useState } from 'react';
import { Sparkles } from 'lucide-react';
import type { Transaction } from '@/types';
import { buildSpendingReview, type SpendingMood } from '@/lib/spending-review';
import { formatAmount } from '@/lib/utils';
import { DancingMascot } from './DancingMascot';

interface Props {
  transactions: Transaction[];
  exchangeRates: Record<string, number>;
}

/** 평가 등급별 말풍선 배색 (Tailwind는 정적 클래스만 인식하므로 전부 문자열로) */
const THEME: Record<
  SpendingMood,
  { bubble: string; tail: string; badge: string; halo: string }
> = {
  empty: {
    bubble: 'border-gray-200 bg-gray-50',
    tail: 'bg-gray-50 border-gray-200',
    badge: 'bg-gray-100 text-gray-600',
    halo: 'from-gray-100/70',
  },
  great: {
    bubble: 'border-emerald-200 bg-emerald-50',
    tail: 'bg-emerald-50 border-emerald-200',
    badge: 'bg-emerald-100 text-emerald-700',
    halo: 'from-emerald-100/70',
  },
  good: {
    bubble: 'border-teal-200 bg-teal-50',
    tail: 'bg-teal-50 border-teal-200',
    badge: 'bg-teal-100 text-teal-700',
    halo: 'from-teal-100/70',
  },
  normal: {
    bubble: 'border-sky-200 bg-sky-50',
    tail: 'bg-sky-50 border-sky-200',
    badge: 'bg-sky-100 text-sky-700',
    halo: 'from-sky-100/70',
  },
  warning: {
    bubble: 'border-amber-200 bg-amber-50',
    tail: 'bg-amber-50 border-amber-200',
    badge: 'bg-amber-100 text-amber-700',
    halo: 'from-amber-100/70',
  },
  alert: {
    bubble: 'border-rose-200 bg-rose-50',
    tail: 'bg-rose-50 border-rose-200',
    badge: 'bg-rose-100 text-rose-700',
    halo: 'from-rose-100/70',
  },
};

const LINE_INTERVAL_MS = 5000;

export function SpendingCoach({ transactions, exchangeRates }: Props) {
  const review = useMemo(
    () => buildSpendingReview(transactions, exchangeRates),
    [transactions, exchangeRates]
  );

  const [lineIdx, setLineIdx] = useState(0);

  useEffect(() => {
    if (review.lines.length <= 1) return;
    const timer = setInterval(
      () => setLineIdx((i) => (i + 1) % review.lines.length),
      LINE_INTERVAL_MS
    );
    return () => clearInterval(timer);
  }, [review.lines.length]);

  // 코멘트 목록이 바뀌면 처음부터
  useEffect(() => setLineIdx(0), [review.lines]);

  const theme = THEME[review.mood];
  const line = review.lines[lineIdx] ?? '';

  const diffLabel =
    review.diffPct === null || review.monthTotal <= 0
      ? '—'
      : `${review.diffPct >= 0 ? '+' : ''}${review.diffPct.toFixed(0)}%`;

  return (
    <section
      className={`relative overflow-hidden rounded-3xl border border-rose-100 bg-gradient-to-br ${theme.halo} via-white to-white shadow-sm shadow-rose-100/40 p-5`}
    >
      <div className="flex items-center gap-1.5 mb-3">
        <Sparkles className="h-4 w-4 text-teal-400" />
        <h3 className="text-sm font-bold text-gray-800">미쿠의 이번 달 평가</h3>
      </div>

      <div className="flex flex-col sm:flex-row-reverse items-center gap-3 sm:gap-6">
        {/* 춤추는 캐릭터 */}
        <DancingMascot
          mood={review.mood}
          className="w-36 h-44 sm:w-48 sm:h-60 shrink-0"
        />

        {/* 말풍선 */}
        <div className="relative w-full flex-1">
          <div className={`relative rounded-3xl border-2 ${theme.bubble} px-5 py-4`}>
            {/* 꼬리: 모바일은 위쪽, 데스크톱은 캐릭터 쪽(오른쪽) */}
            <span
              className={`sm:hidden absolute -top-[9px] left-1/2 -translate-x-1/2 h-4 w-4 rotate-45 border-l-2 border-t-2 ${theme.tail}`}
            />
            <span
              className={`hidden sm:block absolute top-9 -right-[9px] h-4 w-4 rotate-45 border-r-2 border-t-2 ${theme.tail}`}
            />

            <span
              className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${theme.badge}`}
            >
              {review.badge}
            </span>

            <p className="mt-2 text-[15px] font-bold leading-snug text-gray-800">
              {review.headline}
            </p>

            <p
              key={line}
              className="mascot-line-in mt-1.5 text-sm leading-relaxed text-gray-600 min-h-[2.5rem]"
            >
              {line}
            </p>

            {review.lines.length > 1 && (
              <div className="mt-2 flex gap-1">
                {review.lines.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1 rounded-full transition-all ${
                      i === lineIdx ? 'w-4 bg-gray-400' : 'w-1.5 bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* 요약 지표 */}
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <MiniStat label={`${review.monthLabel} 지출`} value={formatAmount(review.monthTotal)} />
            <MiniStat label="최근 평균 대비" value={diffLabel} />
            <MiniStat label="결제 건수" value={`${review.txCount}건`} />
          </div>
        </div>
      </div>
    </section>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/80 border border-gray-100 px-2 py-2">
      <p className="text-[11px] text-gray-400">{label}</p>
      <p className="text-xs font-bold text-gray-800 truncate">{value}</p>
    </div>
  );
}
