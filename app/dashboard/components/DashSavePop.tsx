'use client';

import type { AnimationEvent } from 'react';
import './dash-motion.css';

/**
 * 저장 성공 피드백 (한 번만, 약 1.2초).
 * - DashPiggyPop: 동전이 돼지저금통에 쏙 → 하트가 퐁
 * - DashHeartPop: 하트가 퐁 + 작은 반짝임
 * 끝나면 onDone으로 알려 부모가 내린다.
 * reduced-motion이면 애니메이션 없이 '성공한 모습'(저금통 + 하트)만 남는다.
 */

interface Props {
  onDone?: () => void;
  className?: string;
}

const HEART_PATH =
  'M0 7.2 C -3.6 4.4 -6 2.4 -6 -0.2 C -6 -2.2 -4.5 -3.6 -2.6 -3.6 C -1.4 -3.6 -0.5 -3 0 -2.2 C 0.5 -3 1.4 -3.6 2.6 -3.6 C 4.5 -3.6 6 -2.2 6 -0.2 C 6 2.4 3.6 4.4 0 7.2 Z';

function useDone(onDone?: () => void) {
  // 자식 요소의 animationend도 버블링되므로, 바깥 래퍼의 애니메이션만 본다
  return (e: AnimationEvent<HTMLSpanElement>) => {
    if (e.target === e.currentTarget) onDone?.();
  };
}

export function DashPiggyPop({ onDone, className = '' }: Props) {
  const handleEnd = useDone(onDone);
  return (
    <span
      className={`dash-pop dash-piggy pointer-events-none inline-flex ${className}`}
      onAnimationEnd={handleEnd}
      aria-hidden="true"
    >
      <svg viewBox="0 0 64 64" className="h-12 w-12 overflow-visible">
        {/* 동전 — 몸통보다 먼저 그려 '안으로 들어가는' 것처럼 보이게 */}
        <g className="dash-piggy-coin">
          <circle cx="33" cy="22" r="6.5" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1.4" />
          <path d="M33 18.6 V 25.4" stroke="#f59e0b" strokeWidth="1.6" strokeLinecap="round" />
        </g>

        <g className="dash-piggy-body">
          {/* 다리 */}
          <rect x="17" y="48" width="6.5" height="9" rx="2.6" fill="#f472b6" />
          <rect x="36" y="48" width="6.5" height="9" rx="2.6" fill="#f472b6" />
          {/* 꼬리 */}
          <path
            d="M11.4 41 C 7.6 40.6 7 36.6 9.6 36 C 11.6 35.6 12 38.4 10.2 38.8"
            fill="none"
            stroke="#f472b6"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          {/* 몸통 */}
          <ellipse cx="30" cy="42" rx="20" ry="14.5" fill="#f9a8d4" />
          {/* 귀 */}
          <path d="M19.6 31.6 L 21.6 22.6 L 28 29.2 Z" fill="#f472b6" strokeLinejoin="round" />
          {/* 동전 구멍 */}
          <rect x="28" y="29.4" width="10" height="2.6" rx="1.3" fill="#be185d" opacity="0.65" />
          {/* 코 */}
          <ellipse cx="49" cy="44" rx="5.6" ry="5" fill="#f472b6" />
          <circle cx="47.3" cy="44" r="1.05" fill="#be185d" />
          <circle cx="50.7" cy="44" r="1.05" fill="#be185d" />
          {/* 눈 · 볼 */}
          <circle cx="40" cy="38" r="1.9" fill="#4b5563" />
          <ellipse cx="40.6" cy="45.2" rx="2.6" ry="1.5" fill="#fb7185" opacity="0.45" />
        </g>

        {/* 하트 — CSS transform이 transform 속성을 덮어쓰므로 위치는 바깥 g에 */}
        <g transform="translate(33 12) scale(1.15)">
          <path className="dash-pop-heart" d={HEART_PATH} fill="#fb7185" />
        </g>
      </svg>
    </span>
  );
}

const SPARKS: { cx: number; cy: number; x: string; y: string; fill: string }[] = [
  { cx: 20, cy: 20, x: '-13px', y: '-9px', fill: '#F9B98A' },
  { cx: 20, cy: 20, x: '13px', y: '-10px', fill: '#f9a8d4' },
  { cx: 20, cy: 20, x: '-11px', y: '7px', fill: '#fcd34d' },
  { cx: 20, cy: 20, x: '12px', y: '6px', fill: '#F39A68' },
];

export function DashHeartPop({ onDone, className = '' }: Props) {
  const handleEnd = useDone(onDone);
  return (
    <span
      className={`dash-pop pointer-events-none inline-flex ${className}`}
      onAnimationEnd={handleEnd}
      aria-hidden="true"
    >
      <svg viewBox="0 0 40 40" className="h-10 w-10 overflow-visible">
        {SPARKS.map((s, i) => (
          <circle
            key={i}
            className="dash-pop-spark"
            cx={s.cx}
            cy={s.cy}
            r="1.8"
            fill={s.fill}
            style={{
              ['--dash-spark-x' as string]: s.x,
              ['--dash-spark-y' as string]: s.y,
            }}
          />
        ))}
        <g transform="translate(20 19) scale(1.9)">
          <path className="dash-pop-heart" d={HEART_PATH} fill="#fb7185" />
        </g>
      </svg>
    </span>
  );
}
