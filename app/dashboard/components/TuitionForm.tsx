'use client';

import { useState, useTransition } from 'react';
import { GraduationCap, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Reveal } from '@/app/components/motion';
import { addTuition, type TuitionActionResult } from '../actions';
import { DashHeartPop } from './DashSavePop';

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

export function TuitionForm() {
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayStr());
  const [note, setNote] = useState('');
  const [result, setResult] = useState<TuitionActionResult | null>(null);
  // 저장 성공 시 한 번 퐁 하고 뜨는 하트 (key를 바꿔 매번 처음부터 재생)
  const [pop, setPop] = useState<{ key: number; show: boolean }>({ key: 0, show: false });
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    const amt = Number(amount.replace(/,/g, ''));
    if (!amt || amt <= 0 || isPending) return;
    setResult(null);
    setPop((p) => ({ ...p, show: false }));

    startTransition(async () => {
      const res = await addTuition({ amount: amt, date, note });
      setResult(res);
      if (res.success) {
        setAmount('');
        setNote('');
        setPop((p) => ({ key: p.key + 1, show: true }));
      }
    });
  };

  return (
    <Reveal
      as="section"
      className="bg-white rounded-3xl border border-rose-100 shadow-sm shadow-rose-100/40 p-6"
    >
      <div className="flex items-center gap-2 mb-1">
        <GraduationCap className="h-5 w-5 text-violet-600" />
        <h2 className="text-base font-semibold text-gray-900">등록금·수업료 기록</h2>
      </div>
      <p className="text-sm text-gray-500 mb-4">
        등록금·수업료 등 직접 결제한 금액을 입력하면 전체 지출에 합산됩니다.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-1">
          <label className="block text-xs font-medium text-gray-600 mb-1.5">날짜</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            disabled={isPending}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 disabled:opacity-60"
          />
        </div>
        <div className="sm:col-span-1">
          <label className="block text-xs font-medium text-gray-600 mb-1.5">금액 (원)</label>
          <input
            type="text"
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d,]/g, ''))}
            disabled={isPending}
            placeholder="예: 4,200,000"
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 tabular-nums focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 disabled:opacity-60"
          />
        </div>
        <div className="sm:col-span-1">
          <label className="block text-xs font-medium text-gray-600 mb-1.5">내용 (선택)</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            disabled={isPending}
            placeholder="예: 2학기 등록금"
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 disabled:opacity-60"
          />
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <div className="relative">
          {pop.show && (
            <span className="absolute right-full top-1/2 mr-2 flex -translate-y-1/2">
              <DashHeartPop
                key={pop.key}
                onDone={() => setPop((p) => ({ ...p, show: false }))}
              />
            </span>
          )}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending || !amount.trim()}
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-gradient-to-r from-violet-500 to-rose-400 px-6 py-2.5 text-sm font-semibold text-white shadow-sm shadow-rose-200 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-opacity"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                저장 중…
              </>
            ) : (
              '수업료 추가'
            )}
          </button>
        </div>
      </div>

      {result?.success && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          <CheckCircle className="h-4 w-4 mt-0.5 shrink-0 text-green-600" />
          <span>수업료가 지출 내역에 추가되었습니다.</span>
        </div>
      )}
      {result && !result.success && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-red-500" />
          <span>{result.error ?? '오류가 발생했습니다.'}</span>
        </div>
      )}
    </Reveal>
  );
}
