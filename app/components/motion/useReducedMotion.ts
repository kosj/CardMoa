'use client';

import { useEffect, useState } from 'react';

/**
 * 사용자가 OS에서 '동작 줄이기'를 켰는지 여부.
 * SSR과 첫 렌더에서는 false로 시작해 하이드레이션 불일치를 피한다.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return reduced;
}
