import { Lock } from 'lucide-react';
import { lockAction } from '@/app/unlock/actions';

/** 헤더 오른쪽의 작은 '잠그기' — 이 기기의 가족 쿠키를 지우고 처음 화면으로 */
export function LockButton() {
  return (
    <form action={lockAction} className="shrink-0">
      <button
        type="submit"
        title="이 기기에서 노트를 잠가요"
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-gray-400 ring-1 ring-rose-100 transition-colors duration-base ease-soft hover:bg-rose-50 hover:text-rose-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
      >
        <Lock className="h-3.5 w-3.5" aria-hidden="true" />
        잠그기
      </button>
    </form>
  );
}
