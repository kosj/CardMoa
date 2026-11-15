'use client';

import type { CSSProperties } from 'react';
import type { Memory } from '@/lib/memory-types';
import { handwriting } from '@/app/fonts';
import { storyDayLabel, storyHash, storyTilt } from './StoryFormat';
import './story.css';

/** 마스킹 테이프 색 (반투명이라 사진·종이 위에서 겹쳐 보인다) */
const TAPES = [
  'rgba(253, 164, 175, 0.58)', // rose
  'rgba(249, 185, 138, 0.6)', // dusk
  'rgba(167, 220, 196, 0.62)', // mint
  'rgba(196, 181, 253, 0.5)', // lavender
  'rgba(241, 211, 168, 0.78)', // cream
];

/** 그리드 칸 안에서 사진 비율은 2:3 ~ 4:3 사이로만 (너무 길쭉한 사진은 살짝 잘라 보인다) */
const MIN_RATIO = 2 / 3;
const MAX_RATIO = 4 / 3;

interface Props {
  memory: Memory;
  onOpen: () => void;
}

/**
 * 스크랩북에 붙인 폴라로이드 한 장.
 * 기울기·테이프·살짝 어긋난 자리는 모두 사진 id에서 나와서 언제 봐도 같은 모습이다.
 * 화면에 들어올 때의 '툭 내려앉기'는 MemoryTimeline이 data-story-in으로 켠다.
 */
export function MemoryPolaroid({ memory, onOpen }: Props) {
  const h = storyHash(memory.id);
  const tilt = storyTilt(memory.id);
  // 떨어질 때는 같은 방향으로 조금 더 기울어 있다가 제자리로
  const swing = (tilt >= 0 ? 1 : -1) * (3 + ((h >>> 7) % 4));
  const jitterY = (h >>> 11) % 13; // 0..12px 아래로
  const jitterX = ((h >>> 15) % 9) - 4; // −4..4px

  // 열에 하나는 테이프 대신 하트 스티커
  const sticker = (h >>> 19) % 5 === 0;
  const tapeStyle = {
    ['--story-tape-c' as string]: TAPES[(h >>> 3) % TAPES.length],
    ['--story-tape-r' as string]: `${((h >>> 21) % 13) - 6}deg`,
    ['--story-tape-x' as string]: `${((h >>> 25) % 17) - 8}px`,
    ['--story-tape-stripe' as string]: (h >>> 29) % 2 === 0 ? '0.35' : '0',
  } as CSSProperties;

  const ratio = Math.min(MAX_RATIO, Math.max(MIN_RATIO, memory.width / memory.height));
  const caption = memory.caption.trim();
  const day = storyDayLabel(memory.taken_at);

  return (
    <li
      id={`story-${memory.id}`}
      data-story-drop=""
      className="story-drop scroll-mt-40"
      style={
        {
          top: jitterY,
          left: jitterX,
          ['--story-swing' as string]: `${swing}deg`,
        } as CSSProperties
      }
    >
      <button
        type="button"
        onClick={onOpen}
        className="story-polaroid focus:outline-none"
        style={{ ['--story-tilt' as string]: `${tilt}deg` } as CSSProperties}
        aria-label={`${day}${caption ? ` · ${caption}` : ''} — 사진 크게 보기`}
      >
        {sticker ? (
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="story-sticker"
            style={{
              top: -9,
              [(h >>> 9) % 2 === 0 ? 'left' : 'right']: -8,
              transform: `rotate(${((h >>> 13) % 31) - 15}deg)`,
            }}
          >
            <path
              d="M12 20.6 C 6.4 16.4 3 13.3 3 9.6 C 3 7 5 5 7.5 5 C 9.3 5 10.9 6 12 7.6 C 13.1 6 14.7 5 16.5 5 C 19 5 21 7 21 9.6 C 21 13.3 17.6 16.4 12 20.6 Z"
              fill="#fda4af"
              stroke="#ffffff"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <ellipse cx="8.6" cy="9" rx="1.8" ry="1.1" fill="#ffffff" opacity="0.6" transform="rotate(-30 8.6 9)" />
          </svg>
        ) : (
          <span aria-hidden="true" className="story-tape" style={tapeStyle} />
        )}

        <span className="story-photo" style={{ aspectRatio: String(ratio) }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- 이미 줄여 둔 WebP라 이미지 최적화를 거치지 않는다 */}
          <img
            src={memory.thumb_url}
            width={memory.width}
            height={memory.height}
            alt=""
            loading="lazy"
            decoding="async"
            draggable={false}
          />
        </span>

        <span
          className={`${handwriting.className} story-caption`}
          data-empty={caption ? undefined : 'true'}
        >
          <span>{caption || day}</span>
        </span>
      </button>
    </li>
  );
}
