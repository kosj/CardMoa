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
    <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-1">
        <ClipboardPaste className="h-5 w-5 text-blue-600" />
        <h2 className="text-base font-semibold text-gray-900">
          결제 알림 붙여넣기
        </h2>
      </div>
      <p className="text-sm text-gray-500 mb-4">
        신한카드 또는 롯데카드 결제 알림 문자를 아래에 붙여넣으세요.
        여러 건을 한꺼번에 입력해도 됩니다.
      </p>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={7}
        disabled={isPending}
        placeholder={
          '[신한카드] 6/11 14:30 스타벅스커피 5,500원 승인\n\n[롯데카드] 6/11 18:22 이마트 32,400원 승인\n\n여러 건을 한번에 붙여넣을 수 있습니다.'
        }
        className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 font-mono leading-relaxed focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60 resize-none transition-colors"
      />

      <div className="mt-3 flex items-center justify-between gap-4">
        <span className="text-xs text-gray-400 select-none">
          Ctrl + Enter로도 실행 가능
        </span>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending || !text.trim()}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              AI 분석 중…
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
          <strong>{result.inserted}건</strong>의 결제 내역이 저장되었습니다.
        </span>
      </div>
    );
  }

  if (result.success && result.inserted === 0) {
    return (
      <div className="mt-4 flex items-start gap-2 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
        <Info className="h-4 w-4 mt-0.5 shrink-0 text-yellow-600" />
        <span>
          결제 정보를 찾을 수 없습니다. 문자 내용을 확인 후 다시 시도해주세요.
        </span>
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
