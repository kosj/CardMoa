'use client';

import { useEffect, useRef, useState, type ElementType, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  /** 등장 지연(ms). 여러 카드를 순차로 띄울 때 사용 */
  delay?: number;
  as?: ElementType;
  className?: string;
}

/**
 * 화면에 들어올 때 한 번만 살짝 떠오르며 나타난다.
 * 스타일은 globals.css의 .reveal / .reveal-in, reduced-motion이면 즉시 표시.
 */
export function Reveal({ children, delay = 0, as: Tag = 'div', className = '' }: Props) {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={`reveal ${shown ? 'reveal-in' : ''} ${className}`}
      style={{ ['--reveal-delay' as string]: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}
