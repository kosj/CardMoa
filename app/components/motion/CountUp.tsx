'use client';

import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from './useReducedMotion';

interface Props {
  value: number;
  /** 표시 형식 (예: formatAmount). 기본은 천 단위 쉼표 */
  format?: (n: number) => string;
  /** 애니메이션 길이(ms). 돈 숫자는 짧고 절제 있게 — 기본 600 */
  duration?: number;
  className?: string;
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const defaultFormat = (n: number) => Math.round(n).toLocaleString('ko-KR');

/**
 * 숫자를 0 → value로 부드럽게 올린다.
 * - 값이 바뀌면 이전 값에서 새 값으로 이어서 움직인다 (월 이동 등)
 * - reduced-motion이면 즉시 최종값
 */
export function CountUp({ value, format = defaultFormat, duration = 600, className }: Props) {
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (reduced) {
      fromRef.current = value;
      setDisplay(value);
      return;
    }
    const from = fromRef.current;
    const start = performance.now();

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const current = from + (value - from) * easeOutCubic(t);
      setDisplay(current);
      if (t < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = value;
      }
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      fromRef.current = value;
    };
  }, [value, duration, reduced]);

  return (
    <span className={`tabular-nums ${className ?? ''}`}>{format(display)}</span>
  );
}
