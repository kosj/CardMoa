'use client';

import { useId } from 'react';
import { AlertCircle, CheckCircle2, ImageOff, Loader2, RotateCcw, X } from 'lucide-react';
import { MEMORY_CAPTION_MAX, MEMORY_CHAPTER_MAX, defaultChapter } from '@/lib/memory-types';

/** 준비 중 → 대기 → 올리는 중 → 완료 / 실패. 열 수 없는 파일은 broken */
export type PendingStatus = 'preparing' | 'ready' | 'uploading' | 'done' | 'failed' | 'broken';

export interface PendingItem {
  key: string;
  fileName: string;
  status: PendingStatus;
  error?: string;
  /** <input type="datetime-local"> 값 (KST, 분 단위) */
  takenInput: string;
  /** 찍은 시각 ISO — 날짜 칸을 고치기 전까지는 EXIF의 초 단위까지 그대로. 잘못된 입력이면 null */
  takenAt: string | null;
  /** 날짜를 사진 정보(EXIF)에서 찾았는지, 파일 수정 시각으로 대신했는지 */
  dateSource: 'exif' | 'file';
  chapter: string;
  /** 이 사진의 장 이름을 직접 고쳤는지 (아니면 같은 날 사진을 따라간다) */
  chapterTouched: boolean;
  caption: string;
  /** 썸네일 WebP의 object URL */
  previewUrl?: string;
}

interface Props {
  item: PendingItem;
  chapterListId: string;
  onDateChange: (key: string, value: string) => void;
  onChapterChange: (key: string, value: string) => void;
  onCaptionChange: (key: string, value: string) => void;
  onRemove: (key: string) => void;
  onRetry: (key: string) => void;
}

const STATUS: Record<PendingStatus, { label: string; className: string }> = {
  preparing: { label: '준비 중', className: 'bg-gray-100 text-gray-500' },
  ready: { label: '대기', className: 'bg-cream-200 text-amber-800' },
  uploading: { label: '올리는 중', className: 'bg-dusk-300/30 text-dusk-500' },
  done: { label: '완료', className: 'bg-emerald-50 text-emerald-700' },
  failed: { label: '실패', className: 'bg-rose-50 text-rose-600' },
  broken: { label: '열 수 없음', className: 'bg-gray-100 text-gray-500' },
};

const inputClass =
  'w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-dusk-400 focus:outline-none focus:ring-1 focus:ring-dusk-400 disabled:bg-gray-50 disabled:text-gray-500';

export function MemoryPendingCard({
  item,
  chapterListId,
  onDateChange,
  onChapterChange,
  onCaptionChange,
  onRemove,
  onRetry,
}: Props) {
  const uid = useId();
  const status = STATUS[item.status];
  const locked = item.status === 'uploading' || item.status === 'done';
  const takenIso = item.takenAt;
  const captionLength = Array.from(item.caption).length;

  return (
    <li
      className={`mem-drop-in rounded-2xl border bg-white p-3 sm:p-4 transition-colors duration-base ${
        item.status === 'failed'
          ? 'border-rose-200'
          : item.status === 'done'
            ? 'border-emerald-100 bg-emerald-50/30'
            : 'border-cream-200'
      }`}
    >
      <div className="grid grid-cols-[80px_minmax(0,1fr)] gap-x-3 gap-y-3 sm:grid-cols-[112px_minmax(0,1fr)]">
        {/* 미리보기 (변환된 썸네일 — EXIF 회전이 반영된 모습 그대로) */}
        <div className="row-span-1 h-20 w-20 overflow-hidden rounded-xl bg-cream-100 sm:row-span-2 sm:h-28 sm:w-28">
          {item.previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.previewUrl}
              alt={`올릴 사진 미리보기 (${item.fileName})`}
              className="mem-preview h-full w-full object-cover"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-gray-300">
              {item.status === 'broken' ? (
                <ImageOff className="h-6 w-6" aria-hidden="true" />
              ) : (
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              )}
            </span>
          )}
        </div>

        {/* 상태 · 파일 이름 */}
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-2">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${status.className}`}
              aria-live="polite"
            >
              {(item.status === 'preparing' || item.status === 'uploading') && (
                <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
              )}
              {item.status === 'done' && (
                <CheckCircle2 className="mem-done-pop h-3 w-3" aria-hidden="true" />
              )}
              {item.status === 'failed' && <AlertCircle className="h-3 w-3" aria-hidden="true" />}
              {status.label}
            </span>
            {!locked && (
              <button
                type="button"
                onClick={() => onRemove(item.key)}
                aria-label={`${item.fileName} 목록에서 빼기`}
                className="-mr-1 -mt-1 rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-dusk-300 transition-colors duration-quick"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <p className="mt-1 truncate text-xs text-gray-500" title={item.fileName}>
            {item.fileName}
          </p>
          {item.status !== 'broken' && item.status !== 'done' && (
            <p
              className={`mt-0.5 text-[11px] leading-snug ${
                item.dateSource === 'exif' ? 'text-gray-400' : 'font-medium text-amber-700'
              }`}
            >
              {item.dateSource === 'exif'
                ? '사진 정보에서 찍은 날짜를 찾았어요'
                : '사진 정보에 날짜가 없어 파일 날짜를 넣었어요. 맞는지 확인해주세요'}
            </p>
          )}
          {item.status === 'done' && (
            <p className="mt-0.5 text-[11px] text-emerald-700">비공개 보관함에 올렸어요</p>
          )}
        </div>

        {/* 입력 칸 */}
        {item.status === 'broken' ? (
          <p className="col-span-2 flex items-start gap-2 rounded-xl bg-gray-50 px-3 py-2.5 text-xs text-gray-600 sm:col-span-1 sm:col-start-2">
            <ImageOff className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" aria-hidden="true" />
            <span>{item.error}</span>
          </p>
        ) : (
          <div className="col-span-2 grid gap-2.5 sm:col-span-1 sm:col-start-2 md:grid-cols-2">
            <div>
              <label htmlFor={`${uid}-date`} className="mb-1 block text-xs font-medium text-gray-600">
                찍은 날짜·시각 <span className="font-normal text-gray-400">(한국 시간)</span>
              </label>
              <input
                id={`${uid}-date`}
                type="datetime-local"
                value={item.takenInput}
                onChange={(e) => onDateChange(item.key, e.target.value)}
                disabled={locked}
                min="1900-01-01T00:00"
                aria-invalid={!takenIso || undefined}
                className={`${inputClass} tabular-nums`}
              />
              {!takenIso && (
                <p className="mt-1 text-[11px] text-rose-600">찍은 날짜를 입력해주세요.</p>
              )}
            </div>
            <div>
              <label htmlFor={`${uid}-chapter`} className="mb-1 block text-xs font-medium text-gray-600">
                장 이름
              </label>
              <input
                id={`${uid}-chapter`}
                type="text"
                list={chapterListId}
                value={item.chapter}
                onChange={(e) => onChapterChange(item.key, e.target.value)}
                disabled={locked}
                maxLength={MEMORY_CHAPTER_MAX}
                placeholder={takenIso ? defaultChapter(takenIso) : '예: 2026년 4월'}
                className={inputClass}
              />
            </div>
            <div className="md:col-span-2">
              <div className="mb-1 flex items-baseline justify-between gap-2">
                <label htmlFor={`${uid}-caption`} className="text-xs font-medium text-gray-600">
                  캡션 <span className="font-normal text-gray-400">(선택)</span>
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
                type="text"
                value={item.caption}
                onChange={(e) => onCaptionChange(item.key, e.target.value)}
                disabled={locked}
                maxLength={MEMORY_CAPTION_MAX}
                placeholder="예: 입학식 날, 벚꽃이 한창이던 교정에서"
                className={inputClass}
              />
            </div>
          </div>
        )}
      </div>

      {item.status === 'uploading' && (
        <div className="mem-progress mt-3" role="progressbar" aria-label={`${item.fileName} 올리는 중`} />
      )}

      {item.status === 'failed' && (
        <div
          role="alert"
          className="mt-3 flex flex-col gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs text-rose-700 sm:flex-row sm:items-center sm:justify-between"
        >
          <span className="flex min-w-0 flex-1 items-start gap-2">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{item.error ?? '사진을 올리지 못했어요.'}</span>
          </span>
          <button
            type="button"
            onClick={() => onRetry(item.key)}
            className="inline-flex shrink-0 items-center gap-1 self-end rounded-full border border-rose-200 bg-white px-3 py-1 font-semibold sm:self-auto text-rose-600 hover:bg-rose-100/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 transition-colors duration-quick"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            다시 시도
          </button>
        </div>
      )}
    </li>
  );
}
