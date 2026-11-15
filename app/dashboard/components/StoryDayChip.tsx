'use client';

import { useState, type CSSProperties } from 'react';
import type { Memory } from '@/lib/memory-types';
import { MemoryLightbox } from './MemoryLightbox';
import { storyDayLabel } from './StoryFormat';
import './story.css';

/** 작은 폴라로이드 묶음의 기울기 — 평소 / 손을 올렸을 때(부채처럼 펼침) */
const REST = [-8, 5, -2];
const FAN = [-14, 2, 12];

/**
 * 생활 기록의 날짜 옆 '이 날의 사진' 칩.
 * 누르면 그날 사진만 라이트박스로 넘겨 본다.
 */
export function StoryDayChip({ memories }: { memories: Memory[] }) {
  const [open, setOpen] = useState(false);
  if (memories.length === 0) return null;

  const day = storyDayLabel(memories[0].taken_at);
  const thumbs = memories.slice(0, 3);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`${day} 사진 ${memories.length}장 보기`}
        className="story-chip inline-flex shrink-0 items-center gap-1.5 rounded-full border border-cream-300 bg-cream-50 py-0.5 pl-1.5 pr-2 text-[11px] font-semibold text-dusk-500 transition-colors duration-quick ease-soft hover:border-dusk-300 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-dusk-300"
      >
        <span className="flex items-center py-0.5" aria-hidden="true">
          {thumbs.map((m, i) => (
            // eslint-disable-next-line @next/next/no-img-element -- 이미 줄여 둔 WebP
            <img
              key={m.id}
              src={m.thumb_url}
              width={m.width}
              height={m.height}
              alt=""
              loading="lazy"
              decoding="async"
              draggable={false}
              className="story-chip-thumb"
              style={
                {
                  ['--story-chip-r' as string]: `${REST[i]}deg`,
                  ['--story-chip-fan' as string]: `${FAN[i]}deg`,
                  zIndex: thumbs.length - i,
                  position: 'relative',
                } as CSSProperties
              }
            />
          ))}
        </span>
        <span className="whitespace-nowrap">
          이 날의 사진 <span className="tabular-nums">{memories.length}</span>
        </span>
      </button>

      {open && (
        <MemoryLightbox
          memories={memories}
          onClose={() => setOpen(false)}
          label={`${day} 사진 크게 보기`}
        />
      )}
    </>
  );
}
