'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { Check, ImageOff, X } from 'lucide-react';
import type { Memory } from '@/lib/memory-types';
import { formatMemoryDate } from './MemoryPickerFormat';

interface Props {
  /** true일 때 모달로 열린다 */
  open: boolean;
  memories: Memory[];
  selectedId: string | null;
  /** 사진을 고르면 id, '사진 없이'를 고르면 null */
  onSelect: (id: string | null) => void;
  onClose: () => void;
  title?: string;
  description?: string;
  /** '사진 없이' 선택지를 보여줄지 */
  allowNone?: boolean;
}

/**
 * 올려 둔 추억 사진 중 한 장을 고르는 모달 (쪽지 사진 붙이기·미쿠 카드에서 공통 사용).
 * 네이티브 <dialog>를 써서 포커스 가두기·Esc 닫기·뒤 화면 비활성을 브라우저에 맡긴다.
 */
export function MemoryPicker({
  open,
  memories,
  selectedId,
  onSelect,
  onClose,
  title = '사진 고르기',
  description,
  allowNone = true,
}: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // 최신 사진이 먼저
  const sorted = [...memories].sort((a, b) => b.taken_at.localeCompare(a.taken_at));

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        // 바깥(backdrop) 클릭으로 닫기
        if (e.target === e.currentTarget) onClose();
      }}
      aria-label={title}
      className="m-auto w-[min(640px,calc(100vw-2rem))] max-h-[min(80vh,720px)] overflow-hidden rounded-3xl border border-cream-300 bg-cream-50 p-0 text-gray-800 shadow-xl backdrop:bg-gray-900/40 backdrop:backdrop-blur-[2px]"
    >
      <div className="flex max-h-[min(80vh,720px)] flex-col">
        <div className="flex items-start justify-between gap-3 border-b border-cream-200 px-5 py-4">
          <div>
            <h2 className="text-sm font-bold text-gray-800">{title}</h2>
            {description && <p className="mt-0.5 text-xs text-gray-500 break-keep">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="rounded-full p-1.5 text-gray-400 hover:bg-cream-100 hover:text-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-dusk-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4">
          {sorted.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <ImageOff className="h-8 w-8 text-cream-300" />
              <p className="text-sm font-medium text-gray-600">아직 올린 사진이 없어요</p>
              <Link
                href="/dashboard/memories"
                className="text-xs font-semibold text-dusk-500 underline decoration-dusk-300 underline-offset-4"
              >
                우리 이야기에서 사진 올리기
              </Link>
            </div>
          ) : (
            <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4" role="listbox" aria-label="추억 사진">
              {allowNone && (
                <li>
                  <button
                    type="button"
                    role="option"
                    aria-selected={selectedId === null}
                    onClick={() => onSelect(null)}
                    className={`flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-dusk-300 ${
                      selectedId === null
                        ? 'border-dusk-400 bg-white text-dusk-500'
                        : 'border-cream-300 bg-white/60 text-gray-400 hover:border-cream-300 hover:bg-white'
                    }`}
                  >
                    <ImageOff className="h-5 w-5" />
                    사진 없이
                  </button>
                </li>
              )}
              {sorted.map((m) => {
                const selected = m.id === selectedId;
                return (
                  <li key={m.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={selected}
                      aria-label={`${formatMemoryDate(m.taken_at)} ${m.caption || m.chapter}`}
                      onClick={() => onSelect(m.id)}
                      className={`group relative block aspect-square w-full overflow-hidden rounded-2xl bg-white p-1 shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-dusk-300 ${
                        selected ? 'ring-2 ring-dusk-400' : 'ring-1 ring-cream-200 hover:ring-cream-300'
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={m.thumb_url}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full rounded-xl object-cover"
                      />
                      <span className="absolute inset-x-1 bottom-1 truncate rounded-b-xl bg-gradient-to-t from-black/45 to-transparent px-1.5 pb-1 pt-4 text-left text-[10px] text-white">
                        {m.caption || m.chapter}
                      </span>
                      {selected && (
                        <span className="absolute right-2 top-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-dusk-500 text-white shadow">
                          <Check className="h-3 w-3" />
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </dialog>
  );
}
