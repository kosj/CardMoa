'use client';

import { useState, useMemo, useTransition } from 'react';
import { ReceiptText, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { formatAmount, formatDate, seoulDateParts, toKRW } from '@/lib/utils';
import { CountUp, Reveal, useReducedMotion } from '@/app/components/motion';
import { deleteTransaction } from '../actions';
import type { Transaction, CardCompany } from '@/types';
import { DashSprout } from './DashSprout';
import './dash-motion.css';

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

/** 행이 접히는 시간 — dash-motion.css의 --dur-base(320ms)와 맞춘다 */
const COLLAPSE_MS = 320;

/** 삭제 중인 행: 'out' = 접히는 중, 'gone' = 접힘 끝(숨김) */
type RemovalState = 'out' | 'gone';

interface Props {
  transactions: Transaction[];
  exchangeRates?: Record<string, number>;
}

const monthKey = (dateStr: string) => {
  const { year, month } = seoulDateParts(dateStr);
  return `${year}-${String(month).padStart(2, '0')}`;
};

export function TransactionList({ transactions, exchangeRates = {} }: Props) {
  const reduced = useReducedMotion();

  // 데이터에 있는 연-월 목록 (최신순, KST 기준)
  const months = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((t) => set.add(monthKey(t.approved_at)));
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [transactions]);

  const [monthIdx, setMonthIdx] = useState(0);
  // 삭제로 달이 사라져도 범위를 벗어나지 않게
  const safeIdx = Math.max(0, Math.min(monthIdx, months.length - 1));
  const selectedMonth = months[safeIdx];

  // 잘못 등록된 내역 삭제 — 행을 먼저 부드럽게 접어 숨기고(낙관적), 실패하면 되살린다
  const [removing, setRemoving] = useState<Record<string, RemovalState>>({});
  const [restored, setRestored] = useState<Record<string, true>>({});
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const setRemoval = (id: string, state: RemovalState | null) =>
    setRemoving((prev) => {
      const next = { ...prev };
      if (state) next[id] = state;
      else delete next[id];
      return next;
    });

  const handleDelete = (t: Transaction) => {
    if (removing[t.id]) return;
    const ok = window.confirm(
      `${t.merchant} ${formatAmount(t.amount, t.currency ?? 'KRW')}\n이 내역을 삭제할까요?`
    );
    if (!ok) return;

    setDeleteError(null);
    setRestored((prev) => {
      if (!prev[t.id]) return prev;
      const next = { ...prev };
      delete next[t.id];
      return next;
    });

    if (reduced) {
      setRemoval(t.id, 'gone');
    } else {
      setRemoval(t.id, 'out');
      window.setTimeout(() => {
        // 그사이 실패로 되살아났다면('out'이 아니면) 건드리지 않는다
        setRemoving((prev) => (prev[t.id] === 'out' ? { ...prev, [t.id]: 'gone' } : prev));
      }, COLLAPSE_MS);
    }

    startTransition(async () => {
      let error: string | null = null;
      try {
        const res = await deleteTransaction(t.id);
        if (!res.success) error = res.error ?? '삭제하지 못했습니다.';
      } catch {
        error = '삭제하지 못했습니다.';
      }
      if (error) {
        setRemoval(t.id, null);
        setRestored((prev) => ({ ...prev, [t.id]: true }));
        setDeleteError(error);
      }
      // 성공하면 서버가 목록을 다시 보내 주며 행이 사라진다 (숨김 상태는 그대로 둔다)
    });
  };

  const monthRows = useMemo(() => {
    if (!selectedMonth) return [];
    return transactions.filter((t) => monthKey(t.approved_at) === selectedMonth);
  }, [transactions, selectedMonth]);

  // 화면에 그릴 행 (접히는 중인 행 포함) / 합계·건수에 셀 행 (삭제 중인 행 제외)
  const visibleRows = useMemo(
    () => monthRows.filter((t) => removing[t.id] !== 'gone'),
    [monthRows, removing]
  );
  const activeRows = useMemo(
    () => monthRows.filter((t) => !removing[t.id]),
    [monthRows, removing]
  );

  // 외화는 환율로 원화 환산해 합산
  const monthTotal = useMemo(
    () => activeRows.reduce((s, t) => s + toKRW(t.amount, t.currency, exchangeRates), 0),
    [activeRows, exchangeRates]
  );

  const label = selectedMonth
    ? `${selectedMonth.split('-')[0]}년 ${Number(selectedMonth.split('-')[1])}월`
    : '-';

  return (
    <Reveal
      as="section"
      className="bg-white rounded-3xl border border-rose-100 shadow-sm shadow-rose-100/40 overflow-hidden"
    >
      {/* 헤더 */}
      <div className="px-5 sm:px-6 py-4 border-b border-rose-50 bg-gradient-to-r from-rose-50/60 to-pink-50/60">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <div className="flex items-center gap-2">
            <ReceiptText className="h-5 w-5 text-rose-400" />
            <h2 className="text-base font-bold text-gray-800">은별이 생활 기록</h2>
            {transactions.length > 0 && (
              <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-rose-500 border border-rose-100 tabular-nums">
                {activeRows.length}건
              </span>
            )}
          </div>

          {/* 월 네비게이션 */}
          {months.length > 0 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setMonthIdx(Math.min(safeIdx + 1, months.length - 1));
                  setDeleteError(null);
                }}
                disabled={safeIdx >= months.length - 1}
                className="p-1.5 rounded-full hover:bg-white disabled:opacity-30 transition-colors"
                aria-label="이전 달"
              >
                <ChevronLeft className="h-4 w-4 text-rose-400" />
              </button>
              <span
                className="text-sm font-semibold text-gray-700 w-24 sm:w-28 text-center"
                aria-live="polite"
              >
                {label}
              </span>
              <button
                onClick={() => {
                  setMonthIdx(Math.max(safeIdx - 1, 0));
                  setDeleteError(null);
                }}
                disabled={safeIdx <= 0}
                className="p-1.5 rounded-full hover:bg-white disabled:opacity-30 transition-colors"
                aria-label="다음 달"
              >
                <ChevronRight className="h-4 w-4 text-rose-400" />
              </button>
            </div>
          )}
        </div>

        {activeRows.length > 0 && (
          <p className="mt-2 text-xs text-gray-400">
            이 달 생활비 합계 (원화 환산){' '}
            <CountUp
              value={monthTotal}
              format={formatAmount}
              className="font-semibold text-rose-500"
            />
          </p>
        )}
      </div>

      {/* 빈 상태 */}
      {transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <DashSprout className="h-20 w-20 mb-2" />
          <p className="text-sm font-medium text-gray-500">아직 기록이 없어요</p>
          <p className="text-xs mt-1 text-gray-400">은별이 소식을 기다리는 중이에요 🌱</p>
        </div>
      ) : (
        // 달을 바꾸면 목록이 살짝 번지듯 바뀐다
        <div key={selectedMonth} className="dash-fade-in">
          {visibleRows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <p className="text-sm text-gray-400">이 달은 조용했네요 ☕</p>
            </div>
          ) : (
            <ul className="divide-y divide-rose-50">
              {visibleRows.map((t) => (
                <li
                  key={t.id}
                  className={`dash-row ${removing[t.id] ? 'dash-row-out' : ''} ${
                    restored[t.id] ? 'dash-fade-in' : ''
                  }`}
                  aria-hidden={removing[t.id] ? true : undefined}
                >
                  <div className="dash-row-inner">
                    <div className="flex items-center justify-between gap-3 px-5 sm:px-6 py-4 hover:bg-rose-50/40 transition-colors">
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

                      {/* 오른쪽: 금액 + 삭제 */}
                      <div className="flex shrink-0 items-center gap-2">
                        <div className="text-right">
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
                        <button
                          type="button"
                          onClick={() => handleDelete(t)}
                          disabled={Boolean(removing[t.id])}
                          tabIndex={removing[t.id] ? -1 : undefined}
                          aria-label={`${t.merchant} 내역 삭제`}
                          className="rounded-full p-1.5 text-gray-300 hover:bg-rose-50 hover:text-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-300 disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {deleteError && (
        <p className="px-5 sm:px-6 py-3 text-sm text-red-600 bg-red-50 border-t border-red-100">
          {deleteError}
        </p>
      )}
    </Reveal>
  );
}
