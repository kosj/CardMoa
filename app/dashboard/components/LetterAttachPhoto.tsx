'use client';

import { useEffect, useRef, useState } from 'react';
import type { Memory } from '@/lib/memory-types';
import { MemoryPicker } from './MemoryPicker';
import { formatMemoryDate } from './MemoryPickerFormat';

interface Props {
  memories: Memory[];
  /** 붙일 사진 id (없으면 null) */
  selectedId: string | null;
  onChange: (id: string | null) => void;
  disabled?: boolean;
}

/**
 * 쪽지 쓰기 — '📎 사진 한 장 붙이기'. 아빠가 쓰는 도구라 담백하게.
 * 사진을 고르면 작은 칩(썸네일 + 캡션·날짜 + 바꾸기/빼기)으로 바뀐다.
 * 올린 사진이 없으면 고르기 창의 빈 화면이 '우리 이야기'로 안내한다.
 */
export function LetterAttachPhoto({ memories, selectedId, onChange, disabled }: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const selected = selectedId ? memories.find((m) => m.id === selectedId) ?? null : null;

  // 붙이기 ↔ 칩으로 바뀌면 사라진 버튼 대신 새 버튼으로 포커스를 옮긴다
  const addRef = useRef<HTMLButtonElement>(null);
  const changeRef = useRef<HTMLButtonElement>(null);
  const focusNext = useRef<'add' | 'change' | null>(null);
  useEffect(() => {
    const target = focusNext.current;
    if (!target) return;
    focusNext.current = null;
    (target === 'add' ? addRef : changeRef).current?.focus();
  }, [selected]);

  const choose = (id: string | null) => {
    if (id !== selectedId) focusNext.current = id ? 'change' : 'add';
    onChange(id);
    setPickerOpen(false);
  };

  const label = selected ? selected.caption.trim() || selected.chapter.trim() : '';

  return (
    <div className="mt-2">
      {selected ? (
        <div className="letter-drop-in flex items-center gap-2.5 rounded-xl border border-cream-300 bg-cream-50 p-1.5 pr-2">
          {/* eslint-disable-next-line @next/next/no-img-element -- 이미 줄여 둔 WebP 썸네일 */}
          <img
            src={selected.thumb_url}
            alt=""
            decoding="async"
            className="h-11 w-11 shrink-0 rounded-lg bg-cream-100 object-cover ring-1 ring-cream-200"
          />
          <span className="min-w-0 flex-1">
            <span className="block text-[11px] font-semibold text-dusk-500">📎 붙인 사진</span>
            <span className="block truncate text-xs text-gray-600">
              {label ? `${label} · ` : ''}
              <span className="tabular-nums text-gray-400">{formatMemoryDate(selected.taken_at)}</span>
            </span>
          </span>
          <button
            ref={changeRef}
            type="button"
            onClick={() => setPickerOpen(true)}
            disabled={disabled}
            className="shrink-0 rounded-full px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-white hover:text-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-dusk-300 disabled:opacity-50 transition-colors duration-quick"
          >
            바꾸기
          </button>
          <button
            type="button"
            onClick={() => choose(null)}
            disabled={disabled}
            aria-label="붙인 사진 빼기"
            className="shrink-0 rounded-full px-2.5 py-1 text-xs font-medium text-gray-400 hover:bg-white hover:text-rose-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-dusk-300 disabled:opacity-50 transition-colors duration-quick"
          >
            빼기
          </button>
        </div>
      ) : (
        <button
          ref={addRef}
          type="button"
          onClick={() => setPickerOpen(true)}
          disabled={disabled}
          className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-cream-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:border-dusk-300 hover:text-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-dusk-300 disabled:opacity-50 transition-colors duration-quick"
        >
          <span aria-hidden="true">📎</span>
          사진 한 장 붙이기 <span className="font-normal text-gray-400">(선택)</span>
        </button>
      )}

      <MemoryPicker
        open={pickerOpen}
        memories={memories}
        selectedId={selectedId}
        onSelect={choose}
        onClose={() => setPickerOpen(false)}
        title="쪽지에 붙일 사진"
        description="고른 사진은 쪽지 오른쪽 위에 클립으로 꽂혀서 함께 가요."
        allowNone
      />
    </div>
  );
}
