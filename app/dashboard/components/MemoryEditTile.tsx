'use client';

import { useEffect, useId, useRef, useState, useTransition } from 'react';
import { AlertCircle, Loader2, Pencil, Trash2 } from 'lucide-react';
import {
  MEMORY_CAPTION_MAX,
  MEMORY_CHAPTER_MAX,
  defaultChapter,
  type Memory,
} from '@/lib/memory-types';
import { deleteMemory, updateMemory } from '../memory-actions';
import { formatKstLong, formatKstShort } from './MemoryFormat';

interface Props {
  memory: Memory;
  chapterListId: string;
  editing: boolean;
  onEdit: (id: string) => void;
  onClose: () => void;
  onSaved: (id: string, patch: { caption: string; chapter: string }) => void;
  onDeleted: (id: string) => void;
}

const inputClass =
  'w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-dusk-400 focus:outline-none focus:ring-1 focus:ring-dusk-400 disabled:opacity-60';

/** 서버와 같은 기준으로 한 줄로 정리 */
const oneLine = (s: string) => s.replace(/\s+/g, ' ').trim();

/** 올린 사진 한 장 — 누르면 그 자리에서 캡션·장 이름을 고치거나 지울 수 있다 */
export function MemoryEditTile({
  memory,
  chapterListId,
  editing,
  onEdit,
  onClose,
  onSaved,
  onDeleted,
}: Props) {
  const uid = useId();
  const tileRef = useRef<HTMLButtonElement>(null);
  const captionRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const keepRef = useRef<HTMLButtonElement>(null);
  const restoreFocus = useRef(false);

  const [caption, setCaption] = useState(memory.caption);
  const [chapter, setChapter] = useState(memory.chapter);
  const [error, setError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [saving, startSave] = useTransition();
  const [deleting, startDelete] = useTransition();

  // 펼칠 때마다 현재 값으로 시작하고 캡션 칸에 커서를 둔다
  useEffect(() => {
    if (editing) {
      setCaption(memory.caption);
      setChapter(memory.chapter);
      setError(null);
      captionRef.current?.focus();
    } else if (restoreFocus.current) {
      restoreFocus.current = false;
      tileRef.current?.focus();
    }
    // memory 값이 바뀌어도 고치던 내용을 덮어쓰지 않는다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);

  const shortDate = formatKstShort(memory.taken_at);
  const label = memory.caption || '캡션 없음';

  const close = () => {
    restoreFocus.current = true;
    onClose();
  };

  const save = () => {
    if (saving) return;
    const next = { caption: oneLine(caption), chapter: oneLine(chapter) };
    setError(null);
    startSave(async () => {
      try {
        const res = await updateMemory(memory.id, next);
        if (!res.success) {
          setError(res.error ?? '사진 정보를 고치지 못했습니다.');
          return;
        }
        onSaved(memory.id, {
          caption: next.caption,
          chapter: next.chapter || defaultChapter(memory.taken_at),
        });
        close();
      } catch {
        setError('사진 정보를 고치지 못했습니다. 잠시 후 다시 시도해주세요.');
      }
    });
  };

  const askDelete = () => {
    setDeleteError(null);
    dialogRef.current?.showModal();
    keepRef.current?.focus();
  };

  const confirmDelete = () => {
    if (deleting) return;
    setDeleteError(null);
    startDelete(async () => {
      try {
        const res = await deleteMemory(memory.id);
        if (!res.success) {
          setDeleteError(res.error ?? '사진을 지우지 못했습니다.');
          return;
        }
        dialogRef.current?.close();
        onDeleted(memory.id);
      } catch {
        setDeleteError('사진을 지우지 못했습니다. 잠시 후 다시 시도해주세요.');
      }
    });
  };

  if (!editing) {
    return (
      <li>
        <button
          ref={tileRef}
          type="button"
          onClick={() => onEdit(memory.id)}
          aria-label={`${shortDate} 사진 고치기 — ${label}`}
          className="group block w-full rounded-xl text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-dusk-300 focus-visible:ring-offset-2"
        >
          <span className="relative block aspect-square overflow-hidden rounded-xl bg-cream-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={memory.thumb_url}
              alt=""
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover transition-transform duration-base ease-soft group-hover:scale-[1.04]"
            />
            <span
              aria-hidden="true"
              className="absolute right-1.5 top-1.5 rounded-full bg-white/85 p-1 text-gray-500 opacity-0 shadow-sm transition-opacity duration-quick group-hover:opacity-100 group-focus-visible:opacity-100"
            >
              <Pencil className="h-3 w-3" />
            </span>
          </span>
          <span className="mt-1 block text-[11px] tabular-nums text-gray-400">{shortDate}</span>
          <span
            className={`block truncate text-xs ${memory.caption ? 'text-gray-600' : 'text-gray-300'}`}
          >
            {label}
          </span>
        </button>
      </li>
    );
  }

  const captionLength = Array.from(caption).length;

  return (
    <li className="col-span-full">
      <div
        className="mem-drop-in rounded-2xl border border-dusk-300/60 bg-cream-50 p-3 sm:p-4"
        onKeyDown={(e) => {
          if (e.key === 'Escape' && !dialogRef.current?.open) {
            e.preventDefault();
            close();
          }
        }}
      >
        <form
          className="grid gap-3 sm:grid-cols-[160px_minmax(0,1fr)] sm:gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <div className="flex justify-center overflow-hidden rounded-xl bg-white sm:items-start">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={memory.thumb_url}
              alt={`${shortDate}에 찍은 사진`}
              width={memory.width}
              height={memory.height}
              className="h-auto max-h-56 w-auto max-w-full object-contain sm:max-h-48"
            />
          </div>

          <div className="grid content-start gap-2.5">
            <p className="text-xs font-semibold text-dusk-500">{formatKstLong(memory.taken_at)}</p>
            <div>
              <label htmlFor={`${uid}-chapter`} className="mb-1 block text-xs font-medium text-gray-600">
                장 이름
              </label>
              <input
                id={`${uid}-chapter`}
                type="text"
                list={chapterListId}
                value={chapter}
                onChange={(e) => setChapter(e.target.value)}
                disabled={saving}
                maxLength={MEMORY_CHAPTER_MAX}
                placeholder={defaultChapter(memory.taken_at)}
                className={inputClass}
              />
            </div>
            <div>
              <div className="mb-1 flex items-baseline justify-between gap-2">
                <label htmlFor={`${uid}-caption`} className="text-xs font-medium text-gray-600">
                  캡션
                </label>
                <span
                  className={`text-[11px] tabular-nums ${
                    captionLength >= MEMORY_CAPTION_MAX - 20 ? 'font-semibold text-dusk-500' : 'text-gray-400'
                  }`}
                >
                  {captionLength} / {MEMORY_CAPTION_MAX}
                </span>
              </div>
              <input
                id={`${uid}-caption`}
                ref={captionRef}
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                disabled={saving}
                maxLength={MEMORY_CAPTION_MAX}
                placeholder="사진 아래 적을 한마디"
                className={inputClass}
              />
            </div>

            {error && (
              <p
                role="alert"
                className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700"
              >
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>{error}</span>
              </p>
            )}

            <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={askDelete}
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 disabled:opacity-50 transition-colors duration-quick"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                사진 지우기
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={close}
                  disabled={saving}
                  className="rounded-full px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 disabled:opacity-50 transition-colors duration-quick"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-full bg-dusk-500 px-4 py-1.5 text-xs font-semibold text-white hover:bg-dusk-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-dusk-300 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-quick"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                      저장 중…
                    </>
                  ) : (
                    '저장'
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* 지우기 확인 — 네이티브 모달이라 Esc·포커스 가두기가 기본으로 된다 */}
      <dialog
        ref={dialogRef}
        aria-labelledby={`${uid}-del-title`}
        aria-describedby={`${uid}-del-desc`}
        onCancel={(e) => {
          if (deleting) e.preventDefault();
        }}
        className="mem-dialog w-[min(92vw,360px)] rounded-3xl border border-cream-200 bg-white p-5 text-left shadow-xl"
      >
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={memory.thumb_url}
            alt=""
            className="h-14 w-14 shrink-0 rounded-xl bg-cream-100 object-cover"
          />
          <div>
            <h4 id={`${uid}-del-title`} className="text-sm font-bold text-gray-800">
              이 사진을 지울까요?
            </h4>
            <p id={`${uid}-del-desc`} className="mt-0.5 text-xs leading-relaxed text-gray-500">
              비공개 보관함에서도 지워지고, 되돌릴 수 없어요.
            </p>
          </div>
        </div>
        {deleteError && (
          <p
            role="alert"
            className="mt-3 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700"
          >
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{deleteError}</span>
          </p>
        )}
        <div className="mt-4 flex justify-end gap-2">
          <button
            ref={keepRef}
            type="button"
            onClick={() => dialogRef.current?.close()}
            disabled={deleting}
            className="rounded-full px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 disabled:opacity-50 transition-colors duration-quick"
          >
            그대로 두기
          </button>
          <button
            type="button"
            onClick={confirmDelete}
            disabled={deleting}
            className="inline-flex items-center gap-1.5 rounded-full bg-rose-500 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 transition-colors duration-quick"
          >
            {deleting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                지우는 중…
              </>
            ) : (
              '지우기'
            )}
          </button>
        </div>
      </dialog>
    </li>
  );
}
