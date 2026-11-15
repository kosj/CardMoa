'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { ChevronDown, ImagePlus, Loader2, Lock } from 'lucide-react';
import { Reveal } from '@/app/components/motion';
import {
  MEMORY_FULL_EDGE,
  MEMORY_THUMB_EDGE,
  defaultChapter,
  memoryDateKey,
  type Memory,
} from '@/lib/memory-types';
import {
  MEMORY_FULL_MAX_BYTES,
  MEMORY_THUMB_MAX_BYTES,
  decodeImage,
  describeImageError,
  readExifDate,
  resizeToWebp,
  type ResizedImage,
} from '@/lib/image-pipeline';
import { uploadMemory } from '../memory-actions';
import { MemoryEditTile } from './MemoryEditTile';
import { fromKstInput, kstDayOfInput, toKstInput } from './MemoryFormat';
import { MemoryPendingCard, type PendingItem } from './MemoryPendingCard';
import './mem.css';

const ACCEPT = 'image/jpeg,image/png,image/webp,image/heic,.heic';
const NETWORK_ERROR = '사진을 올리지 못했어요. 인터넷 연결을 확인하고 다시 시도해주세요.';

interface Prepared {
  full: ResizedImage;
  thumb: ResizedImage;
}

type TextPatch = { caption: string; chapter: string };

/**
 * 추억 정리하기 — '우리 이야기' 맨 아래, 아빠가 사진을 올리고 고치는 도구.
 * 기본은 접혀 있다. 사진은 브라우저에서 WebP로 줄이며 메타데이터를 지운 뒤
 * 한 장씩 차례로 올린다. (실패한 사진이 있어도 나머지는 계속)
 */
export function MemoryManager({ memories }: { memories: Memory[] }) {
  const uid = useId();
  const bodyId = `${uid}-body`;
  const inputId = `${uid}-files`;
  const chapterListId = `${uid}-chapters`;
  const listHeadingRef = useRef<HTMLHeadingElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  /* ── 올릴 사진 (대기열) ── */
  const [items, setItems] = useState<PendingItem[]>([]);
  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const memoriesRef = useRef(memories);
  useEffect(() => {
    memoriesRef.current = memories;
  }, [memories]);

  const keySeq = useRef(0);
  const filesRef = useRef(new Map<string, File>());
  const preparedRef = useRef(new Map<string, Prepared>());
  const removedRef = useRef(new Set<string>());
  const urlsRef = useRef(new Set<string>());
  const prepChain = useRef<Promise<void>>(Promise.resolve());
  const uploadChain = useRef<Promise<void>>(Promise.resolve());
  const queuedRef = useRef(new Set<string>());

  const [preparingAll, setPreparingAll] = useState(false);
  const [run, setRun] = useState({ total: 0, finished: 0 });
  const uploading = run.finished < run.total;

  // 화면을 떠나면 미리보기 URL 정리
  useEffect(() => {
    const urls = urlsRef.current;
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u));
      urls.clear();
    };
  }, []);

  // 올리는 도중 페이지를 닫으려 하면 한 번 묻는다
  useEffect(() => {
    if (!uploading) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [uploading]);

  const patchItem = useCallback((key: string, patch: Partial<PendingItem>) => {
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, ...patch } : i)));
  }, []);

  /**
   * 장 이름 추천: 같은 날 대기열에서 직접 쓴 장 이름 → 같은 날 이미 올린 사진의 장 이름
   * → 찍은 달('2026년 4월')
   */
  const suggestChapter = useCallback(
    (takenInput: string, pool: PendingItem[], exceptKey?: string): string => {
      const day = kstDayOfInput(takenInput);
      const typed = pool.find(
        (i) =>
          i.key !== exceptKey &&
          i.chapterTouched &&
          i.status !== 'broken' &&
          kstDayOfInput(i.takenInput) === day
      );
      if (typed) return typed.chapter;
      const existing = memoriesRef.current.find(
        (m) => m.chapter && memoryDateKey(m.taken_at) === day
      );
      if (existing) return existing.chapter;
      const iso = fromKstInput(takenInput);
      return iso ? defaultChapter(iso) : '';
    },
    []
  );

  /** 한 장 준비: 한 번 디코딩해서 큰 사진·썸네일 WebP를 만든다 */
  const prepare = useCallback(
    async (key: string) => {
      const file = filesRef.current.get(key);
      filesRef.current.delete(key);
      if (!file || removedRef.current.has(key)) return;
      try {
        const bitmap = await decodeImage(file);
        let prepared: Prepared;
        try {
          const full = await resizeToWebp(bitmap, MEMORY_FULL_EDGE, MEMORY_FULL_MAX_BYTES);
          const thumb = await resizeToWebp(bitmap, MEMORY_THUMB_EDGE, MEMORY_THUMB_MAX_BYTES);
          prepared = { full, thumb };
        } finally {
          bitmap.close();
        }
        if (removedRef.current.has(key)) return;
        preparedRef.current.set(key, prepared);
        const previewUrl = URL.createObjectURL(prepared.thumb.blob);
        urlsRef.current.add(previewUrl);
        patchItem(key, { status: 'ready', previewUrl });
      } catch (err) {
        patchItem(key, { status: 'broken', error: describeImageError(err) });
      }
    },
    [patchItem]
  );

  const addFiles = useCallback(
    async (list: FileList | File[] | null) => {
      const files = Array.from(list ?? []);
      if (files.length === 0) return;

      // 1) 날짜부터 (앞부분만 읽어서 빠르다) — 없으면 파일 수정 시각
      const dated = await Promise.all(
        files.map(async (file) => {
          const exif = await readExifDate(file);
          return {
            file,
            date: exif ?? new Date(file.lastModified || Date.now()),
            source: exif ? ('exif' as const) : ('file' as const),
          };
        })
      );
      dated.sort((a, b) => a.date.getTime() - b.date.getTime());

      // 2) 찍은 순서대로 대기열에 추가
      const pool = [...itemsRef.current];
      const added: PendingItem[] = [];
      for (const d of dated) {
        const takenAt = d.date.toISOString();
        const takenInput = toKstInput(takenAt);
        const item: PendingItem = {
          key: `mem-${++keySeq.current}`,
          fileName: d.file.name || '사진',
          status: 'preparing',
          takenInput,
          takenAt,
          dateSource: d.source,
          chapter: suggestChapter(takenInput, pool),
          chapterTouched: false,
          caption: '',
        };
        pool.push(item);
        added.push(item);
        filesRef.current.set(item.key, d.file);
      }
      setItems((prev) => [...prev, ...added]);

      // 3) 변환은 한 장씩 (휴대폰 메모리 보호)
      for (const item of added) {
        prepChain.current = prepChain.current.then(() => prepare(item.key));
      }
    },
    [prepare, suggestChapter]
  );

  /* ── 입력 ── */

  const onDateChange = useCallback(
    (key: string, value: string) => {
      setItems((prev) =>
        prev.map((i) => {
          if (i.key !== key) return i;
          const takenAt = fromKstInput(value);
          const next = { ...i, takenInput: value, takenAt };
          const valid = takenAt !== null;
          if (!i.chapterTouched && valid) {
            next.chapter = suggestChapter(value, prev, key);
          }
          // 날짜를 고쳤으면 실패 표시를 지우고 다시 '대기'로
          if (i.status === 'failed' && valid) {
            next.status = 'ready';
            next.error = undefined;
          }
          return next;
        })
      );
    },
    [suggestChapter]
  );

  /** 장 이름을 쓰면, 같은 날 찍었고 아직 직접 고치지 않은 사진들도 함께 따라간다 */
  const onChapterChange = useCallback((key: string, value: string) => {
    setItems((prev) => {
      const self = prev.find((i) => i.key === key);
      if (!self) return prev;
      const day = kstDayOfInput(self.takenInput);
      return prev.map((i) => {
        if (i.key === key) return { ...i, chapter: value, chapterTouched: true };
        const follows =
          !i.chapterTouched &&
          i.status !== 'uploading' &&
          i.status !== 'done' &&
          i.status !== 'broken' &&
          kstDayOfInput(i.takenInput) === day;
        return follows ? { ...i, chapter: value } : i;
      });
    });
  }, []);

  const onCaptionChange = useCallback(
    (key: string, value: string) => patchItem(key, { caption: value }),
    [patchItem]
  );

  const forget = (key: string, previewUrl?: string) => {
    removedRef.current.add(key);
    filesRef.current.delete(key);
    preparedRef.current.delete(key);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      urlsRef.current.delete(previewUrl);
    }
  };

  const onRemove = useCallback((key: string) => {
    const item = itemsRef.current.find((i) => i.key === key);
    if (!item || item.status === 'uploading' || queuedRef.current.has(key)) return;
    forget(key, item.previewUrl);
    setItems((prev) => prev.filter((i) => i.key !== key));
  }, []);

  const clearDone = () => {
    for (const i of itemsRef.current) if (i.status === 'done') forget(i.key, i.previewUrl);
    setItems((prev) => prev.filter((i) => i.status !== 'done'));
  };

  /* ── 올리기 (한 장씩 차례로) ── */

  const uploadOne = useCallback(
    async (key: string) => {
      const item = itemsRef.current.find((i) => i.key === key);
      const prepared = preparedRef.current.get(key);
      if (!item || !prepared || removedRef.current.has(key)) return;

      const takenAt = item.takenAt;
      if (!takenAt) {
        patchItem(key, { status: 'failed', error: '찍은 날짜를 입력해주세요.' });
        return;
      }

      patchItem(key, { status: 'uploading', error: undefined });
      const fd = new FormData();
      fd.append('full', prepared.full.blob, 'full.webp');
      fd.append('thumb', prepared.thumb.blob, 'thumb.webp');
      fd.append('taken_at', takenAt);
      fd.append('caption', item.caption);
      fd.append('chapter', item.chapter);
      fd.append('width', String(prepared.full.width));
      fd.append('height', String(prepared.full.height));

      try {
        const res = await uploadMemory(fd);
        if (res.success) {
          preparedRef.current.delete(key); // 큰 사진 메모리 해제 (미리보기는 남긴다)
          patchItem(key, { status: 'done', error: undefined });
        } else {
          patchItem(key, { status: 'failed', error: res.error ?? NETWORK_ERROR });
        }
      } catch {
        patchItem(key, { status: 'failed', error: NETWORK_ERROR });
      }
    },
    [patchItem]
  );

  const enqueue = useCallback(
    (keys: string[]) => {
      const fresh = keys.filter((k) => !queuedRef.current.has(k));
      if (fresh.length === 0) return;
      setRun((r) =>
        r.finished >= r.total
          ? { total: fresh.length, finished: 0 }
          : { ...r, total: r.total + fresh.length }
      );
      for (const key of fresh) {
        queuedRef.current.add(key);
        uploadChain.current = uploadChain.current.then(async () => {
          try {
            await uploadOne(key);
          } finally {
            queuedRef.current.delete(key);
            setRun((r) => ({ ...r, finished: r.finished + 1 }));
          }
        });
      }
    },
    [uploadOne]
  );

  const uploadAll = async () => {
    if (preparingAll) return;
    // 아직 변환 중인 사진이 있으면 끝날 때까지 기다린다
    setPreparingAll(true);
    await prepChain.current;
    setPreparingAll(false);
    const keys = itemsRef.current
      .filter(
        (i) =>
          (i.status === 'ready' || i.status === 'failed' || i.status === 'preparing') &&
          preparedRef.current.has(i.key) &&
          !removedRef.current.has(i.key)
      )
      .map((i) => i.key);
    enqueue(keys);
  };

  const onRetry = useCallback((key: string) => enqueue([key]), [enqueue]);

  /* ── 이미 올린 사진 (화면에서 바로 반영) ── */
  const [editingId, setEditingId] = useState<string | null>(null);
  const [overrides, setOverrides] = useState<Record<string, TextPatch>>({});
  const [hidden, setHidden] = useState<Set<string>>(() => new Set());

  const shown = useMemo(
    () =>
      memories
        .filter((m) => !hidden.has(m.id))
        .map((m) => (overrides[m.id] ? { ...m, ...overrides[m.id] } : m)),
    [memories, hidden, overrides]
  );

  // 찍은 순서대로, 장 이름이 바뀔 때마다 묶음을 나눈다
  const groups = useMemo(() => {
    const out: { key: string; chapter: string; items: Memory[] }[] = [];
    for (const m of shown) {
      const last = out[out.length - 1];
      if (last && last.chapter === m.chapter) last.items.push(m);
      else out.push({ key: `${m.id}-g`, chapter: m.chapter, items: [m] });
    }
    return out;
  }, [shown]);

  const chapters = useMemo(() => {
    const seen = new Set<string>();
    for (const m of shown) if (m.chapter) seen.add(m.chapter);
    for (const i of items) if (i.chapter.trim()) seen.add(i.chapter.trim());
    return Array.from(seen);
  }, [shown, items]);

  const onSaved = useCallback((id: string, patch: TextPatch) => {
    setOverrides((o) => ({ ...o, [id]: patch }));
  }, []);

  const onDeleted = useCallback((id: string) => {
    setHidden((h) => new Set(h).add(id));
    setEditingId(null);
    listHeadingRef.current?.focus();
  }, []);

  /* ── 요약 ── */
  const counts = useMemo(() => {
    const c = { preparing: 0, ready: 0, uploading: 0, done: 0, failed: 0, broken: 0 };
    for (const i of items) c[i.status]++;
    return c;
  }, [items]);
  const uploadable = counts.ready + counts.failed + counts.preparing;
  const busy = uploading || preparingAll;

  let summary = '';
  if (items.length > 0) {
    const parts: string[] = [];
    if (counts.preparing) parts.push(`${counts.preparing}장 준비 중`);
    if (counts.done) parts.push(`${counts.done}장 올림`);
    if (counts.failed) parts.push(`${counts.failed}장 실패`);
    if (counts.broken) parts.push(`${counts.broken}장 열 수 없음`);
    summary = parts.join(' · ');
  }

  return (
    <Reveal
      as="section"
      className="break-keep rounded-3xl border border-cream-200 bg-gradient-to-br from-cream-50 via-white to-white shadow-sm shadow-rose-100/40"
    >
      <h2>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={bodyId}
          className="flex w-full items-center gap-3 rounded-3xl px-4 py-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-dusk-300 sm:px-5"
        >
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-cream-100 text-dusk-500">
            <ImagePlus className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-gray-800">
              추억 정리하기{' '}
              <span className="font-normal text-gray-500">(사진 올리기·고치기)</span>
            </span>
            <span className="mt-0.5 block text-xs text-gray-400">
              {memories.length > 0 ? `올린 사진 ${shown.length}장` : '아직 올린 사진이 없어요'}
              {uploading && ` · 올리는 중 ${Math.min(run.finished + 1, run.total)}/${run.total}`}
            </span>
          </span>
          <ChevronDown
            className={`h-5 w-5 shrink-0 text-gray-400 transition-transform duration-base ease-soft ${
              open ? 'rotate-180' : ''
            }`}
            aria-hidden="true"
          />
        </button>
      </h2>

      <div id={bodyId} hidden={!open}>
        {open && (
          <div className="mem-drop-in space-y-6 border-t border-cream-200 px-4 pb-5 pt-4 sm:px-5 sm:pb-6">
            <p className="flex items-start gap-2 rounded-2xl bg-cream-100/70 px-3.5 py-2.5 text-xs leading-relaxed text-gray-600">
              <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-dusk-500" aria-hidden="true" />
              <span>사진은 비공개 보관함에 저장되고, 위치 정보 등 메타데이터는 올리기 전에 지워져요.</span>
            </p>

            {/* 사진 고르기 */}
            <div
              onDragOver={(e) => {
                if (!e.dataTransfer.types.includes('Files')) return;
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                if (!e.dataTransfer.files.length) return;
                e.preventDefault();
                setDragOver(false);
                void addFiles(e.dataTransfer.files);
              }}
              className={`rounded-2xl border-2 border-dashed px-4 py-5 text-center transition-colors duration-quick ${
                dragOver ? 'border-dusk-300 bg-dusk-300/10' : 'border-cream-300 bg-white/70'
              }`}
            >
              <input
                id={inputId}
                ref={fileInputRef}
                type="file"
                multiple
                accept={ACCEPT}
                className="peer sr-only"
                onChange={(e) => {
                  const files = e.target.files ? Array.from(e.target.files) : [];
                  e.target.value = ''; // 같은 사진을 다시 골라도 동작하도록
                  void addFiles(files);
                }}
              />
              <label
                htmlFor={inputId}
                className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-dusk-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-dusk-300/40 hover:bg-dusk-400 peer-focus-visible:ring-2 peer-focus-visible:ring-dusk-300 peer-focus-visible:ring-offset-2 transition-colors duration-quick"
              >
                <ImagePlus className="h-4 w-4" aria-hidden="true" />
                사진 고르기
              </label>
              <p className="mt-2.5 text-xs text-gray-500">
                여러 장을 한꺼번에 골라도 돼요. 컴퓨터에서는 여기로 끌어다 놓아도 돼요.
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-gray-400">
                JPEG·PNG·WebP·HEIC · 아이폰 HEIC 사진은 브라우저에 따라 열리지 않을 수 있어요. 그럴 땐
                JPEG로 바꿔서 올려주세요.
              </p>
            </div>

            {/* 올릴 사진 */}
            {items.length > 0 && (
              <section aria-labelledby={`${uid}-pending-title`}>
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <h3 id={`${uid}-pending-title`} className="text-sm font-semibold text-gray-800">
                    올릴 사진 <span className="font-normal text-gray-400">{items.length}장</span>
                  </h3>
                  <p className="text-xs text-gray-500" aria-live="polite">
                    {summary}
                  </p>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-gray-400">
                  같은 날 찍은 사진은 한 장에 쓴 장 이름을 함께 따라가요. 따로 고친 사진은 그대로 둬요.
                </p>

                <ul className="mt-3 space-y-3">
                  {items.map((item) => (
                    <MemoryPendingCard
                      key={item.key}
                      item={item}
                      chapterListId={chapterListId}
                      onDateChange={onDateChange}
                      onChapterChange={onChapterChange}
                      onCaptionChange={onCaptionChange}
                      onRemove={onRemove}
                      onRetry={onRetry}
                    />
                  ))}
                </ul>

                <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
                  {counts.done > 0 && (
                    <button
                      type="button"
                      onClick={clearDone}
                      className="rounded-full border border-cream-300 bg-white px-4 py-2 text-xs font-medium text-gray-600 hover:bg-cream-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-dusk-300 transition-colors duration-quick"
                    >
                      다 올린 사진 목록에서 지우기
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => void uploadAll()}
                    disabled={busy || uploadable === 0}
                    className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-dusk-400 to-rose-400 px-6 py-2.5 text-sm font-semibold text-white shadow-sm shadow-rose-200 hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-dusk-300 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-opacity duration-quick"
                  >
                    {busy ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        {preparingAll
                          ? '사진 준비 중…'
                          : `올리는 중… ${Math.min(run.finished + 1, run.total)}/${run.total}`}
                      </>
                    ) : (
                      `모두 올리기${uploadable > 0 ? ` (${uploadable}장)` : ''}`
                    )}
                  </button>
                </div>
              </section>
            )}

            {/* 이미 올린 사진 */}
            <section aria-labelledby={`${uid}-list-title`} className="border-t border-cream-200 pt-5">
              <h3
                id={`${uid}-list-title`}
                ref={listHeadingRef}
                tabIndex={-1}
                className="text-sm font-semibold text-gray-800 focus:outline-none"
              >
                올린 사진 <span className="font-normal text-gray-400">{shown.length}장</span>
              </h3>
              {shown.length === 0 ? (
                <p className="mt-2 text-xs text-gray-400">
                  아직 올린 사진이 없어요. 위에서 사진을 골라 첫 추억을 올려 보세요.
                </p>
              ) : (
                <>
                  <p className="mt-1 text-xs text-gray-400">
                    사진을 누르면 캡션과 장 이름을 고치거나 지울 수 있어요.
                  </p>
                  <div className="mt-3 space-y-4">
                    {groups.map((g) => (
                      <div key={g.key}>
                        <h4 className="mb-2 flex items-baseline gap-1.5 text-xs font-semibold text-dusk-500">
                          {g.chapter || '장 이름 없음'}
                          <span className="font-normal text-gray-400">{g.items.length}</span>
                        </h4>
                        <ul className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-6">
                          {g.items.map((m) => (
                            <MemoryEditTile
                              key={m.id}
                              memory={m}
                              chapterListId={chapterListId}
                              editing={editingId === m.id}
                              onEdit={setEditingId}
                              onClose={() => setEditingId(null)}
                              onSaved={onSaved}
                              onDeleted={onDeleted}
                            />
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </section>

            <datalist id={chapterListId}>
              {chapters.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
        )}
      </div>
    </Reveal>
  );
}
