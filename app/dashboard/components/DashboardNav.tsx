'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { LayoutDashboard, CalendarRange } from 'lucide-react';
import './dash-motion.css';

const TABS = [
  { href: '/dashboard', label: '이번 달', icon: LayoutDashboard },
  { href: '/dashboard/transactions', label: '생활 기록', icon: CalendarRange },
];

/** 밑줄을 탭 양 끝에서 살짝 안쪽으로 (px) — 정적 밑줄의 inset-x-2와 같아야 한다 */
const INSET = 8;

// 서버에서는 useLayoutEffect 경고가 나므로 클라이언트에서만 레이아웃 이펙트를 쓴다
const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export function DashboardNav() {
  const pathname = usePathname();
  const activeIdx = TABS.findIndex(({ href }) =>
    href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href)
  );

  const listRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(null);
  // 첫 측정 직후에는 transition 없이 제자리에 두고, 그다음부터 미끄러지게 한다
  const [animate, setAnimate] = useState(false);

  // 페인트 전에 활성 탭의 위치를 재고, 크기가 바뀌면(폰트 로딩·리사이즈) 다시 잰다
  useIsoLayoutEffect(() => {
    const measure = () => {
      const el = activeIdx >= 0 ? tabRefs.current[activeIdx] : null;
      if (!el) {
        setIndicator(null);
        return;
      }
      const left = el.offsetLeft + INSET;
      const width = Math.max(0, el.offsetWidth - INSET * 2);
      setIndicator((prev) =>
        prev && prev.left === left && prev.width === width ? prev : { left, width }
      );
    };

    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    if (listRef.current) ro.observe(listRef.current);
    tabRefs.current.forEach((t) => t && ro.observe(t));
    return () => ro.disconnect();
  }, [activeIdx]);

  useEffect(() => {
    if (!indicator || animate) return;
    const id = requestAnimationFrame(() => setAnimate(true));
    return () => cancelAnimationFrame(id);
  }, [indicator, animate]);

  return (
    <nav className="mx-auto max-w-4xl px-4 sm:px-6">
      <div ref={listRef} className="relative flex gap-1">
        {TABS.map(({ href, label, icon: Icon }, i) => {
          const active = i === activeIdx;
          return (
            <Link
              key={href}
              href={href}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              aria-current={active ? 'page' : undefined}
              className={`relative inline-flex items-center gap-1.5 px-3 py-3 text-sm font-semibold transition-colors duration-base ease-soft ${
                active ? 'text-rose-500' : 'text-gray-400 hover:text-rose-400'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
              {/* 측정 전(첫 페인트·JS 이전)에도 밑줄이 보이도록 정적 밑줄을 둔다 */}
              {active && !indicator && (
                <span
                  aria-hidden="true"
                  className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-rose-400"
                />
              )}
            </Link>
          );
        })}

        {indicator && (
          <span
            aria-hidden="true"
            data-animate={animate ? 'true' : 'false'}
            className="dash-nav-indicator pointer-events-none absolute bottom-0 h-0.5 rounded-full bg-rose-400"
            style={{ left: indicator.left, width: indicator.width }}
          />
        )}
      </div>
    </nav>
  );
}
