'use client';

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type AnimationEvent,
  type CSSProperties,
} from 'react';
import { Nanum_Pen_Script } from 'next/font/google';
import type { Letter } from '@/lib/letters';
import { useReducedMotion } from '@/app/components/motion';
import './letter.css';

/**
 * 손글씨 폰트 — 편지 본문과 서명("— 아빠가")에만 쓴다.
 * 한글 글리프는 unicode-range로 잘게 나뉘어 있어 미리 불러오지 않는다(preload: false).
 */
const pen = Nanum_Pen_Script({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  preload: false,
  adjustFontFallback: false,
  fallback: ['cursive'],
});

/* ── 날짜 표기 (서버·브라우저가 같은 결과를 내도록 시간대를 고정) ── */

const TZ = 'Asia/Seoul';

const shortFmt = new Intl.DateTimeFormat('ko-KR', {
  timeZone: TZ,
  month: 'long',
  day: 'numeric',
  weekday: 'short',
});
const longFmt = new Intl.DateTimeFormat('ko-KR', {
  timeZone: TZ,
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  weekday: 'long',
});
const dotFmt = new Intl.DateTimeFormat('ko-KR', {
  timeZone: TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** 11월 15일 (일) */
export function formatLetterDate(iso: string): string {
  const parts = shortFmt.formatToParts(new Date(iso));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  return `${get('month')} ${get('day')}일 (${get('weekday')})`;
}

/** 2026년 11월 15일 일요일 */
function formatLongDate(iso: string): string {
  return longFmt.format(new Date(iso));
}

/** 2026. 11. 15. */
function formatDotDate(iso: string): string {
  return dotFmt.format(new Date(iso));
}

/* ── 손글씨 타이밍 — 단어 하나씩 펜으로 써 내려가듯 ── */

type Stroke = { text: string; delay: number; dur: number } | { text: string; space: true };

function planHandwriting(body: string, base: number) {
  const inkChars = Array.from(body.replace(/\s/g, '')).length || 1;
  // 짧은 쪽지는 천천히, 긴 쪽지는 빠르게 — 전체가 대략 2.5~4.5초 안에 끝나도록
  const perChar = Math.min(42, Math.max(9, 2600 / inkChars));
  let t = base;

  const lines: Stroke[][] = body.split(/\r?\n/).map((line) => {
    const strokes: Stroke[] = line
      .split(/(\s+)/)
      .filter((tok) => tok.length > 0)
      .map((tok) => {
        if (/^\s+$/.test(tok)) {
          t += perChar * 0.8;
          return { text: tok, space: true as const };
        }
        const dur = Math.max(70, Array.from(tok).length * perChar);
        const stroke = { text: tok, delay: Math.round(t), dur: Math.round(dur) };
        t += dur;
        return stroke;
      });
    t += 160; // 줄을 바꿀 때 펜을 잠깐 뗀다
    return strokes;
  });

  return { lines, end: Math.round(t) };
}

/* ── 봉투 그림 (viewBox 400×260 기준) ── */

function EnvelopeFlap() {
  return (
    <svg viewBox="0 0 400 161" preserveAspectRatio="none" aria-hidden="true">
      {/* 안쪽 면 — 뒤집혀 열렸을 때 보인다 */}
      <path
        d="M12 0H388Q400 0 396 8L216 150Q200 161 184 150L4 8Q0 0 12 0Z"
        fill="#F2D9B6"
        stroke="#E3BD8E"
        strokeWidth="1.2"
      />
      {/* 바깥 면 + 하트 실링 — 닫혀 있을 때 보인다 */}
      <g className="letter-flap-out">
        <path
          d="M12 0H388Q400 0 396 8L216 150Q200 161 184 150L4 8Q0 0 12 0Z"
          fill="#FDF3E4"
          stroke="#E8C597"
          strokeWidth="1.2"
        />
        <path
          d="M30 6H370L208 132Q200 138 192 132Z"
          fill="#FFFFFF"
          opacity="0.35"
        />
        <g className="letter-seal">
          <circle cx="200" cy="124" r="23" fill="#E77C4D" />
          <circle cx="200" cy="124" r="23" fill="none" stroke="#C9623A" strokeWidth="2" opacity="0.5" />
          <circle cx="200" cy="124" r="16.5" fill="none" stroke="#FFFFFF" strokeWidth="1.2" opacity="0.45" />
          <path
            d="M200 133.5c-6.2-4.3-10-7.8-10-12a5.2 5.2 0 0 1 10-2.1 5.2 5.2 0 0 1 10 2.1c0 4.2-3.8 7.7-10 12Z"
            fill="#FFF6EC"
          />
          <ellipse cx="192.5" cy="113.5" rx="5" ry="2.6" fill="#FFFFFF" opacity="0.35" transform="rotate(-28 192.5 113.5)" />
        </g>
      </g>
    </svg>
  );
}

function EnvelopeFront() {
  return (
    <svg viewBox="0 0 400 260" preserveAspectRatio="none" aria-hidden="true">
      {/* 양옆 날개 */}
      <path d="M0 0L196 146Q200 149 196 152L0 260Z" fill="#FBEAD2" />
      <path d="M400 0L204 146Q200 149 204 152L400 260Z" fill="#FBEAD2" />
      <path d="M0 0L196 146M400 0L204 146" stroke="#E6C293" strokeWidth="1.2" fill="none" />
      {/* 아래 날개 */}
      <path d="M0 260L190 140Q200 134 210 140L400 260Z" fill="#FEF4E6" />
      <path d="M0 260L190 140Q200 134 210 140L400 260" stroke="#EBCDA4" strokeWidth="1.2" fill="none" />
    </svg>
  );
}

/* ── 봉투 + 편지지 무대 ── */

export type EnvelopeMotion = 'none' | 'arrive';

interface Props {
  letter: Letter;
  open: boolean;
  onToggle: () => void;
  /** 가장 최근 쪽지인지 (아니면 '최근 쪽지로' 버튼을 보인다) */
  isLatest: boolean;
  onShowLatest: () => void;
  /** 새 쪽지가 막 도착했을 때 'arrive' — 1회성 날아오기 */
  motion: EnvelopeMotion;
  /** 값이 바뀌면 날아오기 애니메이션을 처음부터 다시 */
  motionKey: number;
  onMotionEnd: () => void;
  /** 펼칠 때마다 바뀌어 손글씨를 처음부터 다시 쓴다 */
  writeKey: number;
  /** 이미 펼친 상태에서 다른 쪽지로 바꿀 때는 손글씨를 바로 시작 */
  quickWrite: boolean;
}

export function LetterEnvelope({
  letter,
  open,
  onToggle,
  isLatest,
  onShowLatest,
  motion,
  motionKey,
  onMotionEnd,
  writeKey,
  quickWrite,
}: Props) {
  const paperId = useId();
  const stageRef = useRef<HTMLDivElement>(null);
  const [paperEl, setPaperEl] = useState<HTMLElement | null>(null);
  const [paperH, setPaperH] = useState(0);

  // 편지지 높이를 재서 봉투 위로 얼마나 올라올지 정한다 (폰트 로딩·폭 변화에도 다시 잰다)
  useEffect(() => {
    if (!paperEl) return;
    const measure = () => setPaperH(paperEl.offsetHeight);
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(paperEl);
    return () => ro.disconnect();
  }, [paperEl]);

  // 안 읽은 쪽지는 화면에 들어올 때 한 번만 살짝 들썩인다 (동작 줄이기면 생략)
  const reduced = useReducedMotion();
  const unopened = !letter.opened_at;
  const [nudgeId, setNudgeId] = useState<string | null>(null);
  const nudgedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const el = stageRef.current;
    if (!el || !unopened || open || motion === 'arrive') return;
    if (nudgedRef.current.has(letter.id)) return;
    if (reduced) return;
    if (typeof IntersectionObserver === 'undefined') return;

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          nudgedRef.current.add(letter.id);
          setNudgeId(letter.id);
          io.disconnect();
        }
      },
      { threshold: 0.6 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [letter.id, unopened, open, motion, reduced]);

  // 날아온 쪽지는 다시 들썩이지 않는다
  useEffect(() => {
    if (motion === 'arrive') nudgedRef.current.add(letter.id);
  }, [motion, letter.id]);

  // 들썩이는 도중에 열면 끝 이벤트가 오지 않으므로 여기서 정리 (다시 닫아도 반복 안 함)
  useEffect(() => {
    if (open) setNudgeId(null);
  }, [open]);

  const writing = useMemo(
    () => planHandwriting(letter.body, quickWrite ? 220 : 820),
    [letter.body, quickWrite]
  );
  const headDelay = quickWrite ? 0 : 600;
  const signDelay = writing.end + 120;

  const animClass =
    motion === 'arrive' && !open
      ? 'letter-arrive'
      : nudgeId === letter.id && !open
        ? 'letter-nudge'
        : '';

  const handleAnimEnd = (e: AnimationEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    if (e.animationName === 'letter-nudge') setNudgeId(null);
    if (e.animationName === 'letter-arrive') onMotionEnd();
  };

  const dateShort = formatLetterDate(letter.created_at);

  return (
    <div className="letter-stage-wrap flex flex-col items-center">
      {/* 상태 한 줄 */}
      <p className="mb-5 flex items-center gap-2 text-sm" aria-live="polite">
        {unopened ? (
          <>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-dusk-400" />
            <span className="font-semibold text-dusk-500">
              {isLatest ? '새 쪽지가 도착했어요' : '아직 안 읽은 쪽지예요'}
            </span>
          </>
        ) : (
          <span className="text-gray-500">
            {isLatest ? `${dateShort}에 받은 쪽지` : `지난 쪽지 · ${dateShort}`}
          </span>
        )}
      </p>

      <div
        ref={stageRef}
        className={`letter-stage ${open ? 'is-open' : ''}`}
        style={{ ['--paper-h' as string]: paperH ? `${paperH}px` : undefined } as CSSProperties}
      >
        <div className="letter-rise">
          <div className="letter-lift">
            <div
              key={motionKey}
              className={`letter-anim ${animClass}`}
              onAnimationEnd={handleAnimEnd}
            >
              {/* 편지지 — 봉투 뒷면과 앞주머니 사이에 끼워진다 */}
              <div className="letter-slot">
                <article
                  ref={setPaperEl}
                  id={paperId}
                  className="letter-paper"
                  aria-label={`아빠의 쪽지, ${dateShort}`}
                >
                  <div key={writeKey} className={open ? 'letter-is-writing' : undefined}>
                    <div
                      className="letter-paper-head"
                      style={{ ['--hd' as string]: `${headDelay}ms` } as CSSProperties}
                    >
                      <span>{formatLongDate(letter.created_at)}</span>
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden="true">
                        <path
                          d="M12 20.5c-5.6-3.9-9-7-9-10.8A4.7 4.7 0 0 1 12 7.6a4.7 4.7 0 0 1 9 2.1c0 3.8-3.4 6.9-9 10.8Z"
                          fill="#F39A68"
                          opacity="0.75"
                        />
                      </svg>
                    </div>

                    <div className={`letter-body ${pen.className}`}>
                      {writing.lines.map((strokes, li) => (
                        <p key={li} className="letter-line">
                          {strokes.map((s, si) =>
                            'space' in s ? (
                              s.text
                            ) : (
                              <span
                                key={si}
                                className="letter-word"
                                style={
                                  {
                                    ['--d' as string]: `${s.delay}ms`,
                                    ['--w' as string]: `${s.dur}ms`,
                                  } as CSSProperties
                                }
                              >
                                {s.text}
                              </span>
                            )
                          )}
                        </p>
                      ))}
                    </div>

                    <p
                      className={`letter-sign ${pen.className}`}
                      style={{ ['--sd' as string]: `${signDelay}ms` } as CSSProperties}
                    >
                      <span className="letter-sign-ink">— 아빠가</span>
                      <svg viewBox="0 0 24 24" className="letter-sign-heart" aria-hidden="true">
                        <path
                          d="M12 20.5c-5.6-3.9-9-7-9-10.8A4.7 4.7 0 0 1 12 7.6a4.7 4.7 0 0 1 9 2.1c0 3.8-3.4 6.9-9 10.8Z"
                          fill="#F07B8E"
                        />
                      </svg>
                    </p>
                  </div>
                </article>
              </div>

              {/* 봉투 — 누르면 열리고, 열린 상태에서 누르면 다시 접힌다 */}
              <button
                type="button"
                className="letter-env-btn"
                onClick={onToggle}
                aria-expanded={open}
                aria-controls={paperId}
                aria-label={
                  open
                    ? '쪽지 접기'
                    : `${dateShort} 쪽지 ${unopened ? '열어 보기 (새 쪽지)' : '다시 읽기'}`
                }
              >
                <span className="letter-env-back" aria-hidden="true" />
                <span className="letter-flap" aria-hidden="true">
                  <EnvelopeFlap />
                </span>
                <span className="letter-env-front" aria-hidden="true">
                  <EnvelopeFront />
                  <span className="letter-env-label">
                    <span className="letter-env-to">To. 은별</span>
                    <span className="letter-env-date">{formatDotDate(letter.created_at)}</span>
                    <span className="letter-env-airmail">✈ 항공 우편</span>
                  </span>
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 안내 · 접기 */}
      <div className="mt-4 flex min-h-[2rem] flex-wrap items-center justify-center gap-2 text-xs">
        {open ? (
          <button
            type="button"
            onClick={onToggle}
            className="rounded-full border border-cream-300 bg-white/70 px-3.5 py-1.5 font-medium text-gray-600 hover:bg-cream-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-dusk-300 transition-colors duration-quick"
          >
            쪽지 접기
          </button>
        ) : (
          <span className="text-gray-400">
            {unopened ? '봉투를 눌러 열어보세요' : '봉투를 누르면 다시 읽을 수 있어요'}
          </span>
        )}
        {!isLatest && (
          <button
            type="button"
            onClick={onShowLatest}
            className="rounded-full px-3 py-1.5 font-medium text-dusk-500 hover:bg-cream-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-dusk-300 transition-colors duration-quick"
          >
            최근 쪽지로 →
          </button>
        )}
      </div>
    </div>
  );
}
