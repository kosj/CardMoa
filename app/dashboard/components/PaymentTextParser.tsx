'use client';

import { useState, useTransition } from 'react';
import { ClipboardPaste, Loader2, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { parseAndSavePaymentText, type ParseActionResult } from '../actions';

export function PaymentTextParser() {
  const [text, setText] = useState('');
  const [result, setResult] = useState<ParseActionResult | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    if (!text.trim() || isPending) return;
    setResult(null);

    startTransition(async () => {
      const res = await parseAndSavePaymentText(text);
      setResult(res);
      if (res.success && res.inserted > 0) {
        setText('');
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <section className="bg-white rounded-3xl border border-rose-100 shadow-sm shadow-rose-100/40 p-6">
      <div className="flex items-center gap-2 mb-1">
        <ClipboardPaste className="h-5 w-5 text-rose-400" />
        <h2 className="text-base font-bold text-gray-800">
          결제 알림 붙여넣기
        </h2>
      </div>
      <p className="text-sm text-gray-500 mb-4">
        신한 SOL트래블(해외), 롯데 트립투로카(해외·국내) 결제 알림을 아래에 붙여넣으세요.
        여러 건을 한꺼번에 입력해도 됩니다.
      </p>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={7}
        disabled={isPending}
        placeholder={
          '(주)아트박스 서울대입구점\n3,800원 승인\n고*종 트립투로카(6*2*)\n일시불, 07/31 19:55\n누적금액 923,665원\n\nSOL트래블해외승인 06/13 06:24\nJPY 570 잔액JPY59,050 (JP)MCDONALD S'
        }
        className="w-full rounded-2xl border border-rose-100 bg-rose-50/40 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 font-mono leading-relaxed focus:border-rose-300 focus:bg-white focus:outline-none focus:ring-1 focus:ring-rose-300 disabled:cursor-not-allowed disabled:opacity-60 resize-none transition-colors"
      />

      <div className="mt-3 flex items-center justify-between gap-4">
        <span className="text-xs text-gray-400 select-none">
          Ctrl + Enter로도 실행 가능
        </span>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending || !text.trim()}
          className="inline-flex shrink-0 items-center gap-2 rounded-full bg-gradient-to-r from-rose-400 to-pink-400 px-6 py-2.5 text-sm font-semibold text-white shadow-sm shadow-rose-200 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-opacity"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              분석 중…
            </>
          ) : (
            '내역 반영하기'
          )}
        </button>
      </div>

      {result && <ResultBanner result={result} />}
    </section>
  );
}

function ResultBanner({ result }: { result: ParseActionResult }) {
  if (result.success && result.inserted > 0) {
    return (
      <div className="mt-4 flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
        <CheckCircle className="h-4 w-4 mt-0.5 shrink-0 text-green-600" />
        <span>
          <strong>{result.inserted}건</strong> 저장됨
          {result.skipped > 0 && (
            <span className="text-green-600"> · {result.skipped}건 중복 건너뜀</span>
          )}
        </span>
      </div>
    );
  }

  if (result.success && result.skipped > 0) {
    return (
      <div className="mt-4 flex items-start gap-2 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
        <Info className="h-4 w-4 mt-0.5 shrink-0 text-yellow-600" />
        <span>이미 저장된 내역입니다. ({result.skipped}건 중복)</span>
      </div>
    );
  }

  if (result.success && result.inserted === 0) {
    return (
      <div className="mt-4 flex items-start gap-2 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
        <Info className="h-4 w-4 mt-0.5 shrink-0 text-yellow-600" />
        <span>인식된 결제 패턴이 없습니다. 신한 SOL트래블(해외) 또는 롯데 트립투로카(해외·국내) 알림을 붙여넣어주세요.</span>
      </div>
    );
  }

  return (
    <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
      <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-red-500" />
      <span>{result.error ?? '오류가 발생했습니다. 잠시 후 다시 시도해주세요.'}</span>
    </div>
  );
}
