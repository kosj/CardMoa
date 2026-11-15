import type { CSSProperties, ReactNode } from 'react';
import './dash-motion.css';

/**
 * 로딩 스켈레톤 조각들 (서버 컴포넌트에서도 사용 가능).
 * 크림 바탕에 로즈빛이 심장박동 리듬으로 번진다 — 모든 조각이 같은 리듬이라 '하나의 루프'로 읽힌다.
 */

export function DashSkel({
  className = '',
  delay = 0,
  style,
}: {
  className?: string;
  /** 박동이 물결처럼 번지도록 조각마다 살짝 늦춘다 (ms) */
  delay?: number;
  style?: CSSProperties;
}) {
  return (
    <div
      className={`dash-skel ${className}`}
      style={{ ['--dash-skel-delay' as string]: `${delay}ms`, ...style }}
    />
  );
}

export function DashSkelCard({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-3xl border border-rose-100 bg-white/80 shadow-sm shadow-rose-100/40 ${className}`}
    >
      {children}
    </div>
  );
}

/** 박동하는 작은 하트 + 안내 문구 */
export function DashSkelHeart({
  label,
  className = '',
  iconClassName = 'h-8 w-8',
}: {
  label?: string;
  className?: string;
  iconClassName?: string;
}) {
  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <svg viewBox="0 0 24 24" className={`dash-skel-heart ${iconClassName}`} aria-hidden="true">
        <path
          d="M12 20.6 C 6.4 16.4 3 13.3 3 9.6 C 3 7 5 5 7.5 5 C 9.3 5 10.9 6 12 7.6 C 13.1 6 14.7 5 16.5 5 C 19 5 21 7 21 9.6 C 21 13.3 17.6 16.4 12 20.6 Z"
          fill="#fda4af"
        />
      </svg>
      {label && <p className="text-xs font-medium text-rose-400">{label}</p>}
    </div>
  );
}
