'use client';

/// <reference types="react-dom/canary" />

import { useEffect, useRef, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { Eye, EyeOff, Loader2, KeyRound } from 'lucide-react';
import { unlockAction, type UnlockState } from './actions';

const INITIAL: UnlockState = { error: null, attempt: 0 };

/**
 * 가족 암호 입력 폼.
 * - JS가 없어도 동작한다 (서버 액션 + 일반 폼 제출)
 * - 틀리면 입력칸이 살짝 흔들리고, 입력한 글자를 선택해 바로 다시 쓸 수 있게 한다
 */
export function UnlockForm({ next }: { next: string }) {
  const [state, formAction] = useFormState(unlockAction, INITIAL);
  const [visible, setVisible] = useState(false);
  const [shaking, setShaking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.attempt === 0 || !state.error) return;
    setShaking(true);
    const input = inputRef.current;
    if (input) {
      input.focus();
      input.select();
    }
  }, [state.attempt, state.error]);

  const hasError = Boolean(state.error);

  return (
    <form action={formAction} className="mt-7 text-left">
      <input type="hidden" name="next" value={next} />
      {/* 비밀번호 관리자가 '어느 계정의 암호인지' 알 수 있게 (화면에는 보이지 않음) */}
      <input
        type="text"
        name="username"
        autoComplete="username"
        defaultValue="은별이 노트"
        hidden
        readOnly
        tabIndex={-1}
      />

      <label htmlFor="gate-passcode" className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
        <KeyRound className="h-4 w-4 text-dusk-400" aria-hidden="true" />
        가족 암호
      </label>

      <div
        className={`gate-field relative mt-2 ${shaking ? 'gate-shake' : ''}`}
        onAnimationEnd={() => setShaking(false)}
      >
        <input
          ref={inputRef}
          id="gate-passcode"
          name="passcode"
          type={visible ? 'text' : 'password'}
          required
          autoFocus
          autoComplete="current-password"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          maxLength={128}
          placeholder="가족끼리 정한 암호"
          aria-invalid={hasError || undefined}
          aria-describedby="gate-passcode-msg"
          className={`block w-full rounded-2xl border bg-white/90 py-3.5 pl-4 pr-12 text-base text-gray-800 placeholder:text-gray-300 shadow-[inset_0_1px_2px_rgba(167,95,112,0.06)] transition-[border-color,box-shadow] duration-base ease-soft focus:outline-none focus:ring-4 ${
            hasError
              ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100'
              : 'border-cream-300 focus:border-dusk-300 focus:ring-dusk-300/25'
          }`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? '암호 숨기기' : '암호 보기'}
          aria-pressed={visible}
          aria-controls="gate-passcode"
          className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-xl p-2.5 text-gray-400 transition-colors duration-quick ease-soft hover:bg-cream-100 hover:text-rose-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
        >
          {visible ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
        </button>
      </div>

      <p
        id="gate-passcode-msg"
        role="alert"
        aria-live="polite"
        className="mt-2 min-h-[1.25rem] text-sm font-medium text-rose-500"
      >
        {state.error && (
          <span key={state.attempt} className="gate-error-in inline-block">
            {state.error}
          </span>
        )}
      </p>

      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-rose-400 to-pink-400 px-6 py-3.5 text-sm font-semibold text-white shadow-md shadow-rose-200 transition-[opacity,box-shadow] duration-base ease-soft hover:opacity-95 hover:shadow-lg hover:shadow-rose-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 focus-visible:ring-offset-2 focus-visible:ring-offset-cream-50 disabled:cursor-wait disabled:opacity-70"
    >
      {pending && <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />}
      {pending ? '확인하는 중…' : '노트 열기'}
    </button>
  );
}
