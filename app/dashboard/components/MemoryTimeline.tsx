'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Images } from 'lucide-react';
import type { Memory } from '@/lib/memory-types';
import { handwriting } from '@/app/fonts';
import { Reveal, useReducedMotion } from '@/app/components/motion';
import { MemoryPolaroid } from './MemoryPolaroid';
import { MemoryLightbox } from './MemoryLightbox';
import { groupStoryChapters, storyDateRange } from './StoryFormat';
import './story.css';

interface Props {
  memories: Memory[];
}

/** 장이 차지하는 칸 수 (모바일 2칸 / 데스크톱 3칸) — Tailwind가 찾을 수 있게 글자 그대로 둔다 */
const SPAN_M = { 1: 'col-span-1', 2: 'col-span-2' } as const;
const SPAN_D = { 1: 'sm:col-span-1', 2: 'sm:col-span-2', 3: 'sm:col-span-3' } as const;
const COLS_M = { 1: 'grid-cols-1', 2: 'grid-cols-2' } as const;
const COLS_D = { 1: 'sm:grid-cols-1', 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-3' } as const;

/** 같은 묶음 안에서 폴라로이드가 차례로 내려앉는 간격 */
const STAGGER_MS = 90;
const STAGGER_MAX = 8;

/**
 * '우리 이야기' — 장(章)마다 폴라로이드를 붙여 둔 스크랩북.
 * 장은 가장 이른 사진 순, 장 안에서는 찍은 순. 사진을 누르면 전체를 앞뒤로 넘겨 본다.
 */
export function MemoryTimeline({ memories }: Props) {
  const reduced = useReducedMotion();
  const chapters = useMemo(() => groupStoryChapters(memories), [memories]);
  // 라이트박스는 장을 넘나들며 이어서 넘긴다 (화면에 보이는 순서 그대로)
  const flat = useMemo(() => chapters.flatMap((c) => c.memories), [chapters]);
  // 각 장의 첫 사진이 전체 목록에서 몇 번째인지
  const offsets = useMemo(() => {
    let acc = 0;
    return chapters.map((c) => {
      const at = acc;
      acc += c.memories.length;
      return at;
    });
  }, [chapters]);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const rootRef = useRef<HTMLOListElement>(null);

  // 화면에 들어오는 폴라로이드를 한 번만 내려앉힌다 — 같이 들어온 것끼리는 위→아래, 왼→오른 순으로
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const items = Array.from(
      root.querySelectorAll<HTMLElement>('[data-story-drop]:not([data-story-in])')
    );
    if (items.length === 0) return;

    const show = (el: HTMLElement, k: number) => {
      el.style.setProperty('--story-delay', `${Math.min(k, STAGGER_MAX) * STAGGER_MS}ms`);
      el.setAttribute('data-story-in', '');
    };

    if (reduced || typeof IntersectionObserver === 'undefined') {
      items.forEach((el) => show(el, 0));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        const hits = entries
          .filter((e) => e.isIntersecting)
          .map((e) => ({ el: e.target as HTMLElement, r: e.boundingClientRect }));
        hits.sort((a, b) =>
          Math.abs(a.r.top - b.r.top) > 40 ? a.r.top - b.r.top : a.r.left - b.r.left
        );
        hits.forEach(({ el }, k) => {
          show(el, k);
          io.unobserve(el);
        });
      },
      { rootMargin: '0px 0px -6% 0px', threshold: 0.12 }
    );
    items.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [flat, reduced]);

  return (
    <>
      <StoryHeader photoCount={memories.length} chapterCount={chapters.length} recent={flat} />

      {chapters.length === 0 ? (
        <StoryEmpty />
      ) : (
        <Reveal
          as="section"
          delay={80}
          className="story-paper rounded-3xl border border-cream-200 shadow-sm shadow-rose-100/40 px-4 pb-7 pt-7 sm:px-8 sm:pb-9 sm:pt-9"
        >
          <h2 className="sr-only">장별 사진</h2>
          {/*
            장은 읽는 순서대로 흘러간다 — 사진이 적은 장은 옆 장과 한 줄에 나란히,
            많은 장은 줄 전체를 쓴다. 장 안의 칸 너비는 바깥 칸과 같아서 폴라로이드 크기가 고르다.
          */}
          <ol
            ref={rootRef}
            className="grid grid-cols-2 gap-x-4 gap-y-11 sm:grid-cols-3 sm:gap-x-8 sm:gap-y-14"
          >
            {chapters.map((chapter, ci) => {
              const n = chapter.memories.length;
              const m = Math.min(n, 2) as 1 | 2;
              const d = Math.min(n, 3) as 1 | 2 | 3;
              const offset = offsets[ci];
              return (
                <li key={chapter.name} className={`${SPAN_M[m]} ${SPAN_D[d]} min-w-0`}>
                  {/* 장 머리 — 실에 꿴 단추 + 이름, 같은 줄의 장들과 점선으로 이어진다 */}
                  <div className="flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 border-dusk-300 bg-cream-50"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-dusk-400" />
                    </span>
                    <h3 className="min-w-0 truncate text-[15px] font-bold text-gray-800 sm:text-base">
                      {chapter.name}
                    </h3>
                    <span aria-hidden="true" className="story-thread min-w-[12px] flex-1" />
                  </div>
                  <p className="mt-1 pl-6 text-[11px] tabular-nums text-gray-400 sm:text-xs">
                    {storyDateRange(chapter.startIso, chapter.endIso)}
                    <span aria-hidden="true"> · </span>
                    <span className="whitespace-nowrap">사진 {n}장</span>
                  </p>

                  <ul
                    className={`mt-6 grid ${COLS_M[m]} ${COLS_D[d]} items-center gap-x-4 gap-y-7 sm:mt-7 sm:gap-x-8 sm:gap-y-10`}
                  >
                    {chapter.memories.map((mem, i) => (
                      <MemoryPolaroid
                        key={mem.id}
                        memory={mem}
                        onOpen={() => setOpenIndex(offset + i)}
                      />
                    ))}
                  </ul>
                </li>
              );
            })}

            {/* 마지막 — 다음 장을 기다리는 자리 */}
            <li className="col-span-2 flex items-center gap-2 sm:col-span-3" aria-hidden="true">
              <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 -translate-x-0.5">
                <path
                  d="M12 20.6 C 6.4 16.4 3 13.3 3 9.6 C 3 7 5 5 7.5 5 C 9.3 5 10.9 6 12 7.6 C 13.1 6 14.7 5 16.5 5 C 19 5 21 7 21 9.6 C 21 13.3 17.6 16.4 12 20.6 Z"
                  fill="#fda4af"
                />
              </svg>
              <p className={`${handwriting.className} text-xl leading-tight text-dusk-500 sm:text-2xl`}>
                다음 장도 같이 채워 가자
              </p>
              <span className="story-thread min-w-[12px] flex-1" />
            </li>
          </ol>
        </Reveal>
      )}

      {openIndex !== null && flat.length > 0 && (
        <MemoryLightbox
          memories={flat}
          startIndex={openIndex}
          onClose={() => setOpenIndex(null)}
          label="우리 이야기 사진 크게 보기"
        />
      )}
    </>
  );
}

/* ── 머리말 카드 ── */

function StoryHeader({
  photoCount,
  chapterCount,
  recent,
}: {
  photoCount: number;
  chapterCount: number;
  recent: Memory[];
}) {
  // 가장 최근 사진 세 장을 부채처럼 펼쳐 둔다 (장식)
  const fan = recent.slice(-3).reverse();

  return (
    <Reveal
      as="section"
      className="relative overflow-hidden rounded-3xl border border-cream-200 bg-gradient-to-br from-cream-100 via-cream-50 to-white p-5 shadow-sm shadow-rose-100/40 sm:p-6"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-dusk-300/20 blur-3xl"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -left-20 bottom-0 h-48 w-48 rounded-full bg-rose-200/20 blur-3xl"
      />

      <div className="relative flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-dusk-300 to-rose-400 shadow-sm shadow-rose-200">
              <Images className="h-4 w-4 text-white" />
            </span>
            <h1 className="text-lg font-bold text-gray-800">우리 이야기</h1>
          </div>
          <p
            className={`${handwriting.className} mt-2 text-[1.45rem] leading-snug text-dusk-500 sm:text-[1.6rem]`}
          >
            같이 웃었던 날들을 모아 두는 곳
            <br />
            메롱한 얼굴까지 전부 다 😛
          </p>
          {photoCount > 0 && (
            <p className="mt-2 text-xs text-gray-500 tabular-nums">
              사진 <span className="font-semibold text-rose-500">{photoCount}</span>장
              <span aria-hidden="true"> · </span>
              이야기 <span className="font-semibold text-rose-500">{chapterCount}</span>개
            </p>
          )}
        </div>

        {fan.length > 0 && (
          <div aria-hidden="true" className="relative mr-1 h-24 w-24 shrink-0 sm:mr-3 sm:h-28 sm:w-32">
            {fan.map((m, i) => (
              <span
                key={m.id}
                className="absolute left-1/2 top-1/2 block w-[60px] bg-white p-[3px] pb-[10px] shadow-md shadow-rose-200/50 sm:w-[70px]"
                style={{
                  transform: `translate(-50%, -50%) translateX(${(i - (fan.length - 1) / 2) * -16}px) rotate(${
                    [7, -6, 2][i] ?? 0
                  }deg)`,
                  zIndex: fan.length - i,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- 이미 줄여 둔 WebP */}
                <img
                  src={m.thumb_url}
                  width={m.width}
                  height={m.height}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="block aspect-[3/4] w-full object-cover"
                />
              </span>
            ))}
          </div>
        )}
      </div>
    </Reveal>
  );
}

/* ── 아직 사진이 없을 때 ── */

function StoryEmpty() {
  return (
    <Reveal
      as="section"
      delay={80}
      className="story-paper flex flex-col items-center rounded-3xl border border-cream-200 px-6 py-14 text-center shadow-sm shadow-rose-100/40"
    >
      <EmptyAlbum />
      <p className="mt-5 text-sm font-semibold text-gray-700">아직 붙여 둔 사진이 없어요</p>
      <p className="mt-1 text-xs text-gray-400">
        아래 &lsquo;추억 정리하기&rsquo;에서 첫 사진을 올려 보세요
      </p>
    </Reveal>
  );
}

/** 빈 폴라로이드 두 장 — 앞장에는 메롱하는 얼굴 낙서, 한 번만 툭 내려앉는다 */
function EmptyAlbum() {
  return (
    <svg viewBox="0 0 200 160" className="h-36 w-44 sm:h-44 sm:w-56" aria-hidden="true" focusable="false">
      {/* 그림자 */}
      <ellipse cx="102" cy="146" rx="62" ry="6" fill="#F8E6CC" />

      {/* 뒷장 */}
      <g transform="rotate(-9 78 80)">
        <rect x="36" y="26" width="80" height="98" rx="3" fill="#FFFFFF" stroke="#F1D3A8" strokeWidth="1.2" />
        <rect x="43" y="33" width="66" height="66" rx="1.5" fill="#FDF4E7" />
        <rect x="58" y="20" width="30" height="11" fill="#A7DCC4" opacity="0.6" transform="rotate(5 73 25)" />
      </g>

      {/* 앞장 — 바깥 g가 내려앉고, 안쪽 g가 기울기를 가진다 */}
      <g className="story-empty-drop">
        <g transform="rotate(6 116 84)">
          <rect x="74" y="30" width="84" height="104" rx="3" fill="#FFFFFF" stroke="#F1D3A8" strokeWidth="1.2" />
          <rect
            x="81"
            y="37"
            width="70"
            height="70"
            rx="1.5"
            fill="#FFFBF5"
            stroke="#F9B98A"
            strokeWidth="1.4"
            strokeDasharray="4 3"
          />
          {/* 메롱 얼굴 낙서 */}
          <path d="M101 66 q4 -5 8 0" fill="none" stroke="#E77C4D" strokeWidth="2" strokeLinecap="round" />
          <path d="M123 66 q4 -5 8 0" fill="none" stroke="#E77C4D" strokeWidth="2" strokeLinecap="round" />
          <path d="M106 79 q10 8 20 0" fill="none" stroke="#E77C4D" strokeWidth="2" strokeLinecap="round" />
          <path d="M112 82 q0 9 5 9 q5 0 5 -9" fill="#FDA4AF" stroke="#E77C4D" strokeWidth="1.6" strokeLinejoin="round" />
          <circle cx="100" cy="76" r="3.2" fill="#FECDD3" />
          <circle cx="132" cy="76" r="3.2" fill="#FECDD3" />
          {/* 캡션 자리의 손글씨 낙서 */}
          <path
            d="M92 120 q5 -4 10 0 t10 0 t10 0 t10 0"
            fill="none"
            stroke="#F1D3A8"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          {/* 테이프 */}
          <rect x="100" y="24" width="32" height="12" fill="#FDA4AF" opacity="0.55" transform="rotate(-6 116 30)" />
        </g>
      </g>

      {/* 반짝 */}
      <path d="M170 34 l2 6 l6 2 l-6 2 l-2 6 l-2 -6 l-6 -2 l6 -2 Z" fill="#F9B98A" />
      <path d="M28 120 l1.4 4 l4 1.4 l-4 1.4 l-1.4 4 l-1.4 -4 l-4 -1.4 l4 -1.4 Z" fill="#FDA4AF" />
    </svg>
  );
}
