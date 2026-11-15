'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
  type TouchEvent,
} from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { Memory } from '@/lib/memory-types';
import { handwriting } from '@/app/fonts';
import { useReducedMotion } from '@/app/components/motion';
import { storyChapterName, storyDayLabel, storyLongDate } from './StoryFormat';
import './story.css';

interface Props {
  /** 넘겨 볼 사진 목록 (보이는 순서 그대로) */
  memories: Memory[];
  /** 처음 펼칠 사진의 순번 */
  startIndex?: number;
  /** 닫기 애니메이션이 끝난 뒤 불린다 — 부모는 여기서 라이트박스를 내린다 */
  onClose: () => void;
  /** 스크린리더용 대화상자 이름 */
  label?: string;
}

/** 닫힘 애니메이션 길이 — story.css의 story-lb-out(200ms)과 맞춘다 */
const CLOSE_MS = 200;
/** 이만큼 옆으로 밀면 다음/이전 사진 */
const SWIPE_PX = 56;

const FOCUSABLE = 'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

type Dir = 'next' | 'prev' | 'none';

/**
 * 사진 크게 보기. 어떤 목록이든 받아서 앞뒤로 넘겨 본다.
 * - ←/→, 버튼, 손가락으로 옆으로 밀기 · Esc나 바깥을 누르면 닫힘
 * - 포커스는 안에 머물고, 닫으면 열었던 자리로 돌아간다
 * - 열려 있는 동안 페이지 스크롤은 잠근다
 */
export function MemoryLightbox({ memories, startIndex = 0, onClose, label }: Props) {
  const reduced = useReducedMotion();
  const count = memories.length;

  const [index, setIndex] = useState(() => Math.max(0, Math.min(startIndex, count - 1)));
  const [dir, setDir] = useState<Dir>('none');
  const [closing, setClosing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null);

  // 손가락 따라가기
  const [drag, setDrag] = useState(0);
  const [dragging, setDragging] = useState(false);
  const touchRef = useRef<{ x: number; y: number; dx: number; axis: 'x' | 'y' | null } | null>(
    null
  );

  const dialogRef = useRef<HTMLDivElement>(null);
  // 첫 렌더 때(포커스를 옮기기 전) 열었던 요소를 기억해 둔다
  const [opener] = useState<HTMLElement | null>(() =>
    typeof document !== 'undefined' ? (document.activeElement as HTMLElement | null) : null
  );
  const closeTimer = useRef<number | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const safeIndex = Math.max(0, Math.min(index, count - 1));
  const memory = memories[safeIndex];

  /* ── 열기: 포털 준비, 스크롤 잠금, 포커스 이동 / 닫기: 모두 되돌림 ── */
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const body = document.body;
    const prevOverflow = body.style.overflow;
    const prevPadding = body.style.paddingRight;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    body.style.overflow = 'hidden';
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;

    dialogRef.current?.focus({ preventScroll: true });

    return () => {
      body.style.overflow = prevOverflow;
      body.style.paddingRight = prevPadding;
      if (opener && opener.isConnected) opener.focus({ preventScroll: true });
    };
  }, [mounted, opener]);

  useEffect(
    () => () => {
      if (closeTimer.current !== null) window.clearTimeout(closeTimer.current);
    },
    []
  );

  const requestClose = useCallback(() => {
    if (closeTimer.current !== null) return;
    const reduce =
      reduced || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      onCloseRef.current();
      return;
    }
    setClosing(true);
    closeTimer.current = window.setTimeout(() => onCloseRef.current(), CLOSE_MS);
  }, [reduced]);

  // 목록이 비면(다른 곳에서 지워지는 등) 바로 닫는다
  useEffect(() => {
    if (count === 0) onCloseRef.current();
  }, [count]);

  const go = useCallback(
    (delta: 1 | -1) => {
      const next = safeIndex + delta;
      if (next < 0 || next >= count) return false;
      setIndex(next);
      setDir(delta > 0 ? 'next' : 'prev');
      return true;
    },
    [safeIndex, count]
  );

  /* ── 키보드: ←/→ 넘기기, Esc 닫기, Tab은 안에서만 돈다 ── */
  useEffect(() => {
    if (!mounted) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        requestClose();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        go(1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        go(-1);
      } else if (e.key === 'Tab') {
        const root = dialogRef.current;
        if (!root) return;
        const items = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
          (el) => el.offsetParent !== null
        );
        if (items.length === 0) {
          e.preventDefault();
          root.focus();
          return;
        }
        const first = items[0];
        const last = items[items.length - 1];
        const active = document.activeElement;
        const inside = active instanceof Node && root.contains(active);
        if (e.shiftKey && (active === first || active === root || !inside)) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && (active === last || !inside)) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [mounted, go, requestClose]);

  /* ── 이웃 사진은 미리 받아 둔다 ── */
  useEffect(() => {
    [safeIndex - 1, safeIndex + 1].forEach((i) => {
      const m = memories[i];
      if (!m) return;
      const img = new Image();
      img.decoding = 'async';
      img.src = m.url;
    });
  }, [safeIndex, memories]);

  /* ── 손가락으로 밀기 ── */
  const onTouchStart = (e: TouchEvent) => {
    if (e.touches.length !== 1) {
      touchRef.current = null;
      return;
    }
    const t = e.touches[0];
    touchRef.current = { x: t.clientX, y: t.clientY, dx: 0, axis: null };
  };

  const onTouchMove = (e: TouchEvent) => {
    const s = touchRef.current;
    if (!s || e.touches.length !== 1) return;
    const t = e.touches[0];
    const dx = t.clientX - s.x;
    const dy = t.clientY - s.y;
    if (!s.axis && (Math.abs(dx) > 10 || Math.abs(dy) > 10)) {
      s.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
    }
    if (s.axis !== 'x') return;
    s.dx = dx;
    if (reduced) return; // 동작 줄이기: 따라오지 않고 놓을 때만 넘긴다
    const atEdge = (dx > 0 && safeIndex === 0) || (dx < 0 && safeIndex === count - 1);
    setDragging(true);
    setDrag(atEdge ? dx * 0.3 : dx);
  };

  const onTouchEnd = () => {
    const s = touchRef.current;
    touchRef.current = null;
    if (!s || s.axis !== 'x') return;
    let moved = false;
    if (s.dx <= -SWIPE_PX) moved = go(1);
    else if (s.dx >= SWIPE_PX) moved = go(-1);
    setDrag(0);
    if (moved) {
      // 넘어갔으면 새 사진이 제 애니메이션으로 들어오도록 되돌림은 즉시
      setDragging(true);
      window.requestAnimationFrame(() => setDragging(false));
    } else {
      setDragging(false);
    }
  };

  /** 사진·버튼 바깥(빈 곳)을 누르면 닫힘 */
  const onStageClick = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) requestClose();
  };

  if (!mounted || !memory) return null;

  const caption = memory.caption.trim();
  const day = storyDayLabel(memory.taken_at);
  const ratio = memory.width / memory.height;
  const atStart = safeIndex === 0;
  const atEnd = safeIndex === count - 1;
  const single = count === 1;
  const photoStyle: CSSProperties = {
    // 화면 폭·높이 둘 다에 맞추고, 비율은 그대로 (이미지가 오기 전에도 자리가 정해져 있다)
    width: `min(calc(100vw - var(--story-lb-side)), 62rem, calc((var(--story-vh) - var(--story-lb-chrome)) * ${ratio.toFixed(4)}))`,
    aspectRatio: `${memory.width} / ${memory.height}`,
    backgroundImage: `url("${memory.thumb_url}")`,
  };

  const navButton = (delta: 1 | -1, className: string) => {
    const disabled = delta < 0 ? atStart : atEnd;
    const Icon = delta < 0 ? ChevronLeft : ChevronRight;
    return (
      <button
        type="button"
        onClick={() => go(delta)}
        aria-disabled={disabled ? 'true' : undefined}
        aria-label={delta < 0 ? '이전 사진' : '다음 사진'}
        className={`story-lb-btn ${className}`}
      >
        <Icon className="h-5 w-5" />
      </button>
    );
  };

  return createPortal(
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={label ?? '사진 크게 보기'}
      tabIndex={-1}
      className="story-lb"
      data-phase={closing ? 'closing' : 'open'}
    >
      <div className="story-lb-backdrop" aria-hidden="true" onClick={requestClose} />

      <div className="story-lb-stage relative flex h-full flex-col">
        {/* 위: 몇 번째 사진인지 + 닫기 */}
        <div
          className="flex items-center justify-between px-4 pt-3 sm:px-6 sm:pt-5"
          onClick={onStageClick}
        >
          <span className="rounded-full bg-black/20 px-2.5 py-1 text-xs font-semibold tabular-nums text-cream-100">
            {safeIndex + 1} / {count}
          </span>
          <button
            type="button"
            onClick={requestClose}
            aria-label="닫기"
            className="story-lb-btn inline-flex h-10 w-10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 가운데: 사진 (데스크톱은 양옆에 넘기기 버튼) */}
        <div
          className="relative flex min-h-0 flex-1 items-center justify-center px-4 sm:px-6"
          onClick={onStageClick}
        >
          {single ||
            navButton(-1, 'absolute left-4 top-1/2 hidden h-12 w-12 -translate-y-1/2 sm:inline-flex lg:left-8')}

          <div
            className="story-lb-drag"
            data-dragging={dragging ? 'true' : 'false'}
            style={drag ? { transform: `translateX(${drag}px)` } : undefined}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onTouchCancel={onTouchEnd}
          >
            <div key={memory.id} className="story-lb-slide" data-dir={dir}>
              <figure className="story-lb-frame">
                <div className="story-lb-photo" style={photoStyle}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- 이미 줄여 둔 WebP라 이미지 최적화를 거치지 않는다 */}
                  <img
                    ref={(el) => {
                      // 캐시에서 바로 온 사진은 onLoad 전에 이미 완료돼 있을 수 있다
                      if (el && el.complete && el.naturalWidth > 0 && loadedUrl !== memory.url) {
                        setLoadedUrl(memory.url);
                      }
                    }}
                    src={memory.url}
                    width={memory.width}
                    height={memory.height}
                    alt={caption ? `${day} — ${caption}` : `${day} 사진`}
                    decoding="async"
                    draggable={false}
                    data-loaded={loadedUrl === memory.url ? 'true' : 'false'}
                    onLoad={() => setLoadedUrl(memory.url)}
                  />
                </div>
                <figcaption className="max-h-[7.5rem] overflow-y-auto px-1 pb-3 pt-2.5 text-center sm:max-h-[6.5rem] sm:pb-4 sm:pt-3">
                  <p className={`${handwriting.className} story-lb-caption`} aria-live="polite">
                    {caption || day}
                  </p>
                  <p className="mt-1 text-[11px] text-gray-400 sm:text-xs">
                    {storyLongDate(memory.taken_at)}
                    <span aria-hidden="true"> · </span>
                    <span className="text-dusk-500">{storyChapterName(memory)}</span>
                  </p>
                </figcaption>
              </figure>
            </div>
          </div>

          {single ||
            navButton(1, 'absolute right-4 top-1/2 hidden h-12 w-12 -translate-y-1/2 sm:inline-flex lg:right-8')}
        </div>

        {/* 아래(모바일): 넘기기 버튼 */}
        <div
          className="flex min-h-[4.5rem] items-center justify-between px-6 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2 sm:hidden"
          onClick={onStageClick}
        >
          {single || (
            <>
              {navButton(-1, 'inline-flex h-12 w-12')}
              <span className="text-[11px] text-cream-200/70">옆으로 밀어서 넘겨 보세요</span>
              {navButton(1, 'inline-flex h-12 w-12')}
            </>
          )}
        </div>
        <div className="hidden pb-5 sm:block" aria-hidden="true" />
      </div>
    </div>,
    document.body
  );
}
