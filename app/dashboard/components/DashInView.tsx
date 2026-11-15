'use client';

import { useEffect, useState, type RefObject } from 'react';

/**
 * 요소가 처음 화면에 들어왔는지 (한 번 true가 되면 그대로).
 * 차트처럼 '마운트될 때 한 번' 움직이는 요소를 실제로 보일 때 마운트하려고 쓴다.
 */
export function useDashInViewOnce(
  ref: RefObject<Element | null>,
  threshold = 0.2
): boolean {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (inView) return;
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, threshold, inView]);

  return inView;
}
