'use client';

import type { CSSProperties } from 'react';
import { handwriting as pen } from '@/app/fonts';
import type { Memory } from '@/lib/memory-types';
import { storyDayLabel } from './StoryFormat';
import './letter.css';

/**
 * 아빠가 쪽지에 클립으로 꽂아 보낸 사진.
 * - LetterPhotoClip: 펼친 편지지 오른쪽 위 모서리에 집혀 있는 작은 폴라로이드 (누르면 크게 보기)
 * - LetterPhotoPeek: 닫힌 봉투 뒤로 살짝 삐져나온 폴라로이드 모서리 (장식)
 * 위치·크기·'찰칵' 모션은 letter.css의 letter-clip-* / letter-peek 에서 정한다.
 */

/** 클립 철사 — 큰 고리가 위, 세 겹으로 접힌 젬 클립 (viewBox 18×54) */
export function LetterPaperclip({ className, style }: { className?: string; style?: CSSProperties }) {
  const wire = 'M4 44V10a6 6 0 0 1 12 0v40a4 4 0 0 1-8 0V16a2 2 0 0 1 4 0v24';
  return (
    <svg
      viewBox="1 2 18 54"
      className={className}
      style={style}
      aria-hidden="true"
      focusable="false"
    >
      {/* 그림자 쪽 철사 */}
      <path
        d={wire}
        fill="none"
        stroke="#8c95a0"
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* 은빛 철사 */}
      <path
        d={wire}
        fill="none"
        stroke="#c9d0d7"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* 반짝임 */}
      <path
        d="M4.6 30V10.4a5.4 5.4 0 0 1 4-5.2"
        fill="none"
        stroke="#ffffff"
        strokeWidth="0.7"
        strokeLinecap="round"
        opacity="0.85"
      />
    </svg>
  );
}

interface ClipProps {
  memory: Memory;
  onOpen: () => void;
  /** 편지지가 다 올라온 뒤에 '찰칵' 꽂히도록 기다리는 시간(ms) */
  delay: number;
}

export function LetterPhotoClip({ memory, onOpen, delay }: ClipProps) {
  const caption = memory.caption.trim();
  const day = storyDayLabel(memory.taken_at);

  return (
    <div
      className="letter-clip"
      style={{ ['--cd' as string]: `${delay}ms` } as CSSProperties}
    >
      <button
        type="button"
        onClick={onOpen}
        className="letter-clip-btn"
        aria-label={`쪽지에 붙은 사진 크게 보기 — ${day}${caption ? ` · ${caption}` : ''}`}
      >
        <span className="letter-clip-photo">
          {/* eslint-disable-next-line @next/next/no-img-element -- 이미 줄여 둔 WebP 썸네일 */}
          <img
            src={memory.thumb_url}
            alt=""
            decoding="async"
            draggable={false}
          />
        </span>
        <span
          className={`letter-clip-cap ${pen.className}`}
          data-empty={caption ? undefined : 'true'}
        >
          {caption || day}
        </span>
      </button>
      <LetterPaperclip className="letter-clip-wire" />
    </div>
  );
}

/** 닫힌 봉투 뒤에서 살짝 보이는 사진 모서리 — '안에 뭔가 더 있어요' */
export function LetterPhotoPeek({ memory }: { memory: Memory }) {
  return (
    <span className="letter-peek" aria-hidden="true">
      <span className="letter-peek-photo">
        {/* eslint-disable-next-line @next/next/no-img-element -- 장식용 작은 썸네일 */}
        <img src={memory.thumb_url} alt="" decoding="async" draggable={false} />
      </span>
      <LetterPaperclip className="letter-peek-wire" />
    </span>
  );
}
