'use client';

import { useCallback, useEffect, useId, useRef, useState, useTransition } from 'react';
import { AlertCircle, ChevronDown, Loader2, PenLine } from 'lucide-react';
import type { Letter } from '@/lib/letters';
import { useReducedMotion } from '@/app/components/motion';
import { openLetter, sendLetter } from '../letter-actions';
import { LetterEnvelope, formatLetterDate } from './LetterEnvelope';
import './letter.css';

interface Props {
  initialLetters: Letter[];
  /** 처음부터 펼쳐 둘 쪽지 id (미리보기·바로가기용, 보통은 비워 둔다) */
  defaultOpenId?: string;
}

const MAX_LENGTH = 500;

/** 서버 목록을 기준으로 합치되, 방금 연 쪽지의 읽음 표시는 잃지 않는다 */
function mergeLetters(server: Letter[], local: Letter[]): Letter[] {
  const byId = new Map<string, Letter>();
  for (const l of local) byId.set(l.id, l);
  for (const s of server) {
    const prev = byId.get(s.id);
    byId.set(s.id, prev ? { ...s, opened_at: s.opened_at ?? prev.opened_at } : s);
  }
  return Array.from(byId.values()).sort(
    (a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)
  );
}

function firstLine(body: string): string {
  return body.split(/\r?\n/).find((l) => l.trim().length > 0)?.trim() ?? '';
}

export function DadLetter({ initialLetters, defaultOpenId }: Props) {
  const uid = useId();
  const reduced = useReducedMotion();
  const draftId = `${uid}-draft`;
  const archiveId = `${uid}-archive`;
  const [letters, setLetters] = useState<Letter[]>(initialLetters);

  // 서버가 다시 렌더링되면(쪽지 저장 후 revalidate 등) 목록을 합친다
  const serverRef = useRef(initialLetters);
  useEffect(() => {
    if (serverRef.current === initialLetters) return;
    serverRef.current = initialLetters;
    setLetters((prev) => mergeLetters(initialLetters, prev));
  }, [initialLetters]);

  const startOpenId =
    defaultOpenId && initialLetters.some((l) => l.id === defaultOpenId)
      ? defaultOpenId
      : null;

  const [selectedId, setSelectedId] = useState<string | null>(
    startOpenId ?? initialLetters[0]?.id ?? null
  );
  const [open, setOpen] = useState(startOpenId !== null);
  const [writeKey, setWriteKey] = useState(0);
  const [quickWrite, setQuickWrite] = useState(false);
  const [arrivingId, setArrivingId] = useState<string | null>(null);
  const [arriveKey, setArriveKey] = useState(0);
  const [archiveOpen, setArchiveOpen] = useState(false);

  const latest = letters[0] ?? null;
  const current = letters.find((l) => l.id === selectedId) ?? latest;
  const older = letters.slice(1);

  const stageRef = useRef<HTMLDivElement>(null);
  const swapTimer = useRef<number | null>(null);
  const clearSwap = () => {
    if (swapTimer.current !== null) window.clearTimeout(swapTimer.current);
    swapTimer.current = null;
  };
  useEffect(
    () => () => {
      if (swapTimer.current !== null) window.clearTimeout(swapTimer.current);
    },
    []
  );

  const scrollToStage = useCallback(() => {
    const el = stageRef.current;
    if (!el) return;
    if (el.getBoundingClientRect().top >= 120) return; // 이미 보이면 그대로
    el.scrollIntoView({
      behavior: reduced ? 'auto' : 'smooth',
      block: 'start',
    });
  }, [reduced]);

  /** 처음 여는 쪽지면 읽음으로 표시한다 (기다리지 않음) */
  const markOpened = useCallback((letter: Letter) => {
    if (letter.opened_at) return;
    const now = new Date().toISOString();
    setLetters((prev) =>
      prev.map((l) => (l.id === letter.id ? { ...l, opened_at: now } : l))
    );
    openLetter(letter.id).catch(() => {
      /* 읽음 표시는 실패해도 화면에는 영향 없음 */
    });
  }, []);

  const toggleEnvelope = () => {
    if (!current) return;
    clearSwap();
    if (open) {
      setOpen(false);
      return;
    }
    setArrivingId(null);
    setQuickWrite(false);
    setWriteKey((k) => k + 1);
    setOpen(true);
    markOpened(current);
  };

  const selectLetter = (letter: Letter) => {
    clearSwap();
    setQuickWrite(open);
    setSelectedId(letter.id);
    setArrivingId(null);
    setWriteKey((k) => k + 1);
    setOpen(true);
    markOpened(letter);
    scrollToStage();
  };

  const showLatest = () => {
    if (!latest) return;
    if (!open) {
      setSelectedId(latest.id);
      return;
    }
    // 편지지가 봉투로 다 들어간 뒤에 최근 쪽지로 바꾼다
    setOpen(false);
    clearSwap();
    swapTimer.current = window.setTimeout(
      () => setSelectedId(latest.id),
      reduced ? 0 : 900
    );
  };

  /* ── 쪽지 쓰기 ── */
  const [composerOpen, setComposerOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [sendError, setSendError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (composerOpen) textareaRef.current?.focus();
  }, [composerOpen]);

  useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(() => setNotice(null), 4000);
    return () => window.clearTimeout(t);
  }, [notice]);

  const send = () => {
    const body = draft.trim();
    if (!body || isPending) return;
    setSendError(null);

    startTransition(async () => {
      try {
        const res = await sendLetter(body);
        if (!res.success || !res.letter) {
          setSendError(res.error ?? '쪽지를 보내지 못했습니다.');
          return;
        }
        const letter = res.letter;
        setLetters((prev) => mergeLetters([letter], prev));
        setSelectedId(letter.id);
        setOpen(false);
        setArrivingId(letter.id);
        setArriveKey((k) => k + 1);
        setDraft('');
        setComposerOpen(false);
        setNotice('쪽지를 보냈어요. 은별이에게 잘 전해질 거예요.');
        window.requestAnimationFrame(scrollToStage);
      } catch {
        setSendError('쪽지를 보내지 못했습니다. 잠시 후 다시 시도해주세요.');
      }
    });
  };

  const openComposer = () => {
    setSendError(null);
    setComposerOpen(true);
  };

  const length = draft.length;
  const canSend = draft.trim().length > 0 && !isPending;

  return (
    <section className="letter-root relative overflow-hidden rounded-3xl border border-cream-200 bg-gradient-to-br from-cream-100 via-cream-50 to-white shadow-sm shadow-rose-100/40 p-5 sm:p-6">
      {/* 노을빛 은은한 배경 */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-dusk-300/20 blur-3xl"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -left-20 bottom-0 h-48 w-48 rounded-full bg-rose-200/20 blur-3xl"
      />

      {/* 헤더 */}
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-gray-800">아빠가 보낸 쪽지 💌</h3>
          <p className="mt-0.5 text-xs text-gray-500">가계부 사이사이, 아빠가 남겨 둔 마음</p>
        </div>
        {letters.length > 0 && !composerOpen && (
          <button
            type="button"
            onClick={openComposer}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-cream-300 bg-white/80 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-white hover:text-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-dusk-300 transition-colors duration-quick"
          >
            <PenLine className="h-3.5 w-3.5" />
            쪽지 쓰기
          </button>
        )}
      </div>

      {/* 쪽지 쓰기 (아빠용 — 기능 위주로 단순하게) */}
      {composerOpen && (
        <div className="letter-drop-in relative mt-4 rounded-2xl border border-cream-300 bg-white/90 p-3 sm:p-4">
          <label htmlFor={draftId} className="block text-xs font-medium text-gray-600 mb-1.5">
            은별이에게 쪽지 쓰기
          </label>
          <textarea
            id={draftId}
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                send();
              }
            }}
            maxLength={MAX_LENGTH}
            rows={4}
            disabled={isPending}
            placeholder="예: 은별아, 시험 기간이라 힘들지? 밥은 꼭 챙겨 먹어."
            className="w-full resize-y rounded-xl border border-gray-300 px-3 py-2.5 text-sm leading-relaxed text-gray-900 placeholder-gray-400 focus:border-dusk-400 focus:outline-none focus:ring-1 focus:ring-dusk-400 disabled:opacity-60"
          />
          <div className="mt-2 flex items-center justify-between gap-3">
            <span
              className={`text-xs tabular-nums ${
                length >= MAX_LENGTH - 50 ? 'text-dusk-500 font-semibold' : 'text-gray-400'
              }`}
              aria-live="polite"
            >
              {length} / {MAX_LENGTH}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setComposerOpen(false);
                  setSendError(null);
                }}
                disabled={isPending}
                className="rounded-full px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 disabled:opacity-50 transition-colors duration-quick"
              >
                취소
              </button>
              <button
                type="button"
                onClick={send}
                disabled={!canSend}
                className="inline-flex items-center gap-1.5 rounded-full bg-dusk-500 px-4 py-1.5 text-xs font-semibold text-white hover:bg-dusk-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-dusk-300 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-quick"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    보내는 중…
                  </>
                ) : (
                  '보내기'
                )}
              </button>
            </div>
          </div>
          {sendError && (
            <p
              role="alert"
              className="mt-3 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs text-rose-700"
            >
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{sendError}</span>
            </p>
          )}
        </div>
      )}

      {notice && (
        <p role="status" className="letter-drop-in relative mt-3 text-center text-xs text-dusk-500">
          {notice}
        </p>
      )}

      {current ? (
        <>
          <div ref={stageRef} className="relative mt-5 scroll-mt-36">
            <LetterEnvelope
              letter={current}
              open={open}
              onToggle={toggleEnvelope}
              isLatest={current.id === latest?.id}
              onShowLatest={showLatest}
              motion={arrivingId === current.id ? 'arrive' : 'none'}
              motionKey={arriveKey}
              onMotionEnd={() => setArrivingId(null)}
              writeKey={writeKey}
              quickWrite={quickWrite}
            />
          </div>

          {/* 지난 쪽지 (편지함) */}
          {older.length > 0 && (
            <div className="relative mt-5 border-t border-cream-200 pt-4">
              <button
                type="button"
                onClick={() => setArchiveOpen((v) => !v)}
                aria-expanded={archiveOpen}
                aria-controls={archiveId}
                className="flex w-full items-center justify-between rounded-xl px-1 py-1 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-dusk-300"
              >
                <span className="text-sm font-semibold text-gray-700">
                  지난 쪽지{' '}
                  <span className="font-normal text-gray-400">{older.length}</span>
                </span>
                <ChevronDown
                  className={`h-4 w-4 text-gray-400 transition-transform duration-base ease-soft ${
                    archiveOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {archiveOpen && (
                <ul id={archiveId} className="mt-3 grid gap-2 sm:grid-cols-2">
                  {older.map((l, i) => {
                    const selected = l.id === current.id && open;
                    return (
                      <li
                        key={l.id}
                        className="letter-drop-in"
                        style={{ ['--i' as string]: `${Math.min(i, 8) * 45}ms` }}
                      >
                        <button
                          type="button"
                          onClick={() => selectLetter(l)}
                          aria-current={selected ? 'true' : undefined}
                          className={`group flex w-full items-start gap-3 rounded-2xl border px-3.5 py-3 text-left transition-[background-color,border-color,transform] duration-quick ease-soft hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-dusk-300 ${
                            selected
                              ? 'border-dusk-300 bg-white'
                              : 'border-cream-200 bg-white/70 hover:border-cream-300 hover:bg-white'
                          }`}
                        >
                          <MiniEnvelope unread={!l.opened_at} />
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-dusk-500">
                              {formatLetterDate(l.created_at)}
                              {!l.opened_at && (
                                <span className="rounded-full bg-dusk-300/30 px-1.5 py-px text-[10px] text-dusk-500">
                                  안 읽음
                                </span>
                              )}
                              {selected && (
                                <span className="text-[10px] font-medium text-gray-400">읽는 중</span>
                              )}
                            </span>
                            <span className="mt-0.5 block truncate text-sm text-gray-600">
                              {firstLine(l.body)}
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </>
      ) : (
        /* 아직 쪽지가 없을 때 */
        <div className="relative mt-5 flex flex-col items-center py-4 text-center">
          <EmptyEnvelope />
          <p className="mt-4 text-sm font-semibold text-gray-700">아직 도착한 쪽지가 없어요</p>
          <p className="mt-1 text-xs text-gray-400">아빠의 첫 쪽지가 이곳에 도착할 거예요</p>
          {!composerOpen && (
            <button
              type="button"
              onClick={openComposer}
              className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-cream-300 bg-white/80 px-4 py-2 text-xs font-medium text-gray-600 hover:bg-white hover:text-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-dusk-300 transition-colors duration-quick"
            >
              <PenLine className="h-3.5 w-3.5" />
              첫 쪽지 쓰기
            </button>
          )}
        </div>
      )}
    </section>
  );
}

/** 편지함 목록의 작은 봉투 아이콘 */
function MiniEnvelope({ unread }: { unread: boolean }) {
  return (
    <span className="relative mt-0.5 shrink-0" aria-hidden="true">
      <svg viewBox="0 0 40 28" className="h-7 w-10">
        <rect x="0.75" y="0.75" width="38.5" height="26.5" rx="4" fill="#FDF3E4" stroke="#E8C597" strokeWidth="1.2" />
        <path d="M1.5 2L20 16L38.5 2" fill="none" stroke="#E3B985" strokeWidth="1.3" strokeLinejoin="round" />
        <path d="M20 19.3c-2.3-1.6-3.7-2.9-3.7-4.4a1.9 1.9 0 0 1 3.7-.8 1.9 1.9 0 0 1 3.7.8c0 1.5-1.4 2.8-3.7 4.4Z" fill={unread ? '#E77C4D' : '#F1C9A6'} />
      </svg>
      {unread && (
        <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-dusk-400" />
      )}
    </span>
  );
}

/** 빈 상태 — 아직 비어 있는 우편함 앞의 봉투 */
function EmptyEnvelope() {
  return (
    <svg viewBox="0 0 160 112" className="h-24 w-36" aria-hidden="true">
      <ellipse cx="80" cy="104" rx="52" ry="5" fill="#F1D3A8" opacity="0.45" />
      <g transform="rotate(-4 80 56)">
        <rect x="22" y="22" width="116" height="76" rx="9" fill="#F8E6CC" />
        <path d="M22 31L80 70L138 31V89a9 9 0 0 1-9 9H31a9 9 0 0 1-9-9Z" fill="#FDF3E4" />
        <path d="M22 98L74 64Q80 60 86 64L138 98" fill="#FEF7EE" stroke="#EBCDA4" strokeWidth="1.2" />
        <path d="M31 22H129a9 9 0 0 1 7 3.4L84 63a6.5 6.5 0 0 1-8 0L24 25.4A9 9 0 0 1 31 22Z" fill="#FBEBD3" stroke="#E8C597" strokeWidth="1.2" />
        <circle cx="80" cy="56" r="9.5" fill="#F39A68" />
        <path d="M80 60.6c-2.9-2-4.6-3.6-4.6-5.5a2.4 2.4 0 0 1 4.6-1 2.4 2.4 0 0 1 4.6 1c0 1.9-1.7 3.5-4.6 5.5Z" fill="#FFF6EC" />
      </g>
      <path d="M128 18c2-6 8-7 10-3" fill="none" stroke="#F39A68" strokeWidth="1.6" strokeLinecap="round" opacity="0.6" />
      <path d="M140 30c3-2 6-1 7 1" fill="none" stroke="#F9B98A" strokeWidth="1.6" strokeLinecap="round" opacity="0.6" />
      <circle cx="24" cy="16" r="2.2" fill="#FBCFE8" />
      <circle cx="14" cy="34" r="1.5" fill="#F9B98A" opacity="0.7" />
    </svg>
  );
}
