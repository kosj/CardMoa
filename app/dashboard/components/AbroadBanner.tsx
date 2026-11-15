'use client';

import { useId, useState, useTransition } from 'react';
import { Pencil, Plane } from 'lucide-react';
import { CountUp, useReducedMotion } from '@/app/components/motion';
import type { AbroadInfo } from '@/lib/settings';
import { updateAbroadInfo } from '../actions';
import './abroad.css';

interface Props {
  info: AbroadInfo;
  /** 서버에서 계산한 오늘 날짜 (KST 'YYYY-MM-DD') — 시간대 불일치 방지 */
  todayKey: string;
}

/** 'YYYY-MM-DD' → 날짜 번호 (일 단위 차이 계산용) */
function dayNumber(key: string): number {
  const [y, m, d] = key.split('-').map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
}

const countFormat = (n: number) => Math.round(n).toLocaleString('ko-KR');

/**
 * 바다 건너 D-day — "교토에서 보낸 지 N일째 · 다음에 만날 날까지 D-N".
 * 도시·날짜는 코드가 아닌 설정(DB)에서 온다. 설정은 아빠가 직접 입력한다.
 */
export function AbroadBanner({ info, todayKey }: Props) {
  const [editing, setEditing] = useState(false);

  const configured = Boolean(info.city && info.since);
  const today = dayNumber(todayKey);

  if (!configured && !editing) {
    return (
      <section className="flex flex-col gap-3 rounded-3xl border border-dashed border-cream-300 bg-cream-50/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white text-dusk-400 shadow-sm shadow-cream-200">
            <Plane className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-bold text-gray-800">바다 건너 D-day</p>
            <p className="mt-0.5 text-xs text-gray-500 break-keep">
              머무는 도시와 떠난 날, 다음 만남을 적어 두면 날짜를 세어 드려요.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="self-start rounded-full border border-cream-300 bg-white px-4 py-1.5 text-xs font-semibold text-gray-600 hover:bg-cream-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-dusk-300 transition-colors duration-quick sm:self-auto"
        >
          설정하기
        </button>
      </section>
    );
  }

  if (editing) {
    return <AbroadEditor info={info} onClose={() => setEditing(false)} />;
  }

  const city = info.city as string;
  const sinceDay = dayNumber(info.since as string);
  const daysAway = today - sinceDay + 1; // 떠난 날이 1일째
  const dday = info.nextVisit ? dayNumber(info.nextVisit) - today : null;

  return (
    <section className="relative overflow-hidden rounded-3xl border border-cream-300/70 bg-gradient-to-r from-cream-50 via-white to-cream-50 px-5 py-4 shadow-sm shadow-rose-100/40">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
        <FlightRoute city={city} />

        <div className="grid flex-1 grid-cols-2 gap-3">
          {/* 머문 날 */}
          <div>
            <p className="text-xs text-gray-500 break-keep">
              {daysAway > 0 ? `${city}에서 보낸 지` : `${city}로 떠나기까지`}
            </p>
            <p className="mt-0.5 text-2xl font-bold text-gray-800">
              {daysAway > 0 ? (
                <>
                  <CountUp value={daysAway} format={countFormat} duration={900} />
                  <span className="ml-0.5 text-sm font-semibold text-gray-500">일째</span>
                </>
              ) : (
                <span className="tabular-nums">D-{1 - daysAway}</span>
              )}
            </p>
          </div>

          {/* 다음 만남 */}
          <div className="border-l border-cream-200 pl-3">
            <p className="text-xs text-gray-500 break-keep">다음에 만날 날까지</p>
            {dday === null || dday < 0 ? (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="mt-1 text-sm font-semibold text-dusk-500 underline decoration-dusk-300 underline-offset-4 hover:text-dusk-400"
              >
                날짜 정하기
              </button>
            ) : dday === 0 ? (
              <p className="mt-0.5 text-lg font-bold text-rose-500">오늘 만나는 날 🎉</p>
            ) : (
              <p className="mt-0.5 text-2xl font-bold tabular-nums text-rose-500">D-{dday}</p>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setEditing(true)}
          aria-label="바다 건너 D-day 설정 고치기"
          className="absolute right-3 top-3 rounded-full p-1.5 text-gray-300 hover:bg-cream-100 hover:text-gray-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-dusk-300 transition-colors duration-quick"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </div>
    </section>
  );
}

/** 집 → 도시로 종이비행기가 한 번 날아가는 작은 항로 그림 */
function FlightRoute({ city }: { city: string }) {
  const reduced = useReducedMotion();
  const pathId = `abroad-arc-${useId().replace(/:/g, '')}`;

  return (
    <svg
      viewBox="0 0 160 62"
      className="abroad-route h-[62px] w-full max-w-[220px] shrink-0 self-center sm:w-[160px]"
      role="img"
      aria-label={`집에서 ${city}까지`}
    >
      <path
        id={pathId}
        className="abroad-arc"
        d="M14 40 Q80 -10 146 40"
        fill="none"
        stroke="#E8B48C"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      {/* 집 */}
      <circle cx="14" cy="40" r="4" fill="#F9B98A" />
      <text x="14" y="57" textAnchor="middle" fontSize="10" fill="#9CA3AF">
        집
      </text>
      {/* 머무는 도시 */}
      <circle className="abroad-ring" cx="146" cy="40" r="4" fill="none" stroke="#F39A68" strokeWidth="1.2" />
      <circle className="abroad-city-dot" cx="146" cy="40" r="4" fill="#E77C4D" />
      <text x="146" y="57" textAnchor="middle" fontSize="10" fill="#6B7280">
        {city.length > 6 ? `${city.slice(0, 6)}…` : city}
      </text>

      {/* 종이비행기 — 한 번 날아가 도시 바로 앞에 멈춘다 (점을 가리지 않게) */}
      {reduced ? (
        <g transform="translate(80 15)">
          <PaperPlane />
        </g>
      ) : (
        <g>
          <PaperPlane />
          <animateMotion
            dur="2.6s"
            begin="0.3s"
            fill="freeze"
            rotate="auto"
            calcMode="spline"
            keyPoints="0;0.88"
            keyTimes="0;1"
            keySplines="0.22 1 0.36 1"
          >
            <mpath href={`#${pathId}`} />
          </animateMotion>
        </g>
      )}
    </svg>
  );
}

function PaperPlane() {
  return (
    <g>
      <path d="M-8 -5 L9 0 L-8 5 L-4.5 0 Z" fill="#E77C4D" />
      <path d="M-4.5 0 L9 0" stroke="#FFF7EE" strokeWidth="0.9" />
    </g>
  );
}

/** 설정 입력 — 아빠가 쓰는 도구라 담백하게 */
function AbroadEditor({ info, onClose }: { info: AbroadInfo; onClose: () => void }) {
  const [city, setCity] = useState(info.city ?? '');
  const [since, setSince] = useState(info.since ?? '');
  const [nextVisit, setNextVisit] = useState(info.nextVisit ?? '');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const save = () => {
    setError(null);
    startTransition(async () => {
      const res = await updateAbroadInfo({ city, since, nextVisit });
      if (res.success) onClose();
      else setError(res.error ?? '저장하지 못했어요.');
    });
  };

  const inputClass =
    'mt-1 w-full rounded-xl border border-cream-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-dusk-300 focus:outline-none focus:ring-1 focus:ring-dusk-300 disabled:opacity-60';

  return (
    <section className="rounded-3xl border border-cream-300 bg-white px-5 py-4 shadow-sm shadow-rose-100/40">
      <div className="flex items-center gap-2">
        <Plane className="h-4 w-4 text-dusk-400" />
        <h2 className="text-sm font-bold text-gray-800">바다 건너 D-day 설정</h2>
      </div>
      <p className="mt-1 text-xs text-gray-500 break-keep">
        도시 이름과 날짜는 이 앱의 비공개 설정에만 저장돼요.
      </p>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <label className="text-xs font-medium text-gray-600">
          머무는 도시
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            maxLength={20}
            placeholder="예: 교토"
            disabled={isPending}
            className={inputClass}
          />
        </label>
        <label className="text-xs font-medium text-gray-600">
          떠난 날
          <input
            type="date"
            value={since}
            onChange={(e) => setSince(e.target.value)}
            disabled={isPending}
            className={inputClass}
          />
        </label>
        <label className="text-xs font-medium text-gray-600">
          다음에 만날 날 <span className="font-normal text-gray-400">(선택)</span>
          <input
            type="date"
            value={nextVisit}
            onChange={(e) => setNextVisit(e.target.value)}
            disabled={isPending}
            className={inputClass}
          />
        </label>
      </div>

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      <div className="mt-3 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          disabled={isPending}
          className="rounded-full px-4 py-1.5 text-xs font-semibold text-gray-500 hover:bg-cream-100 disabled:opacity-50"
        >
          취소
        </button>
        <button
          type="button"
          onClick={save}
          disabled={isPending}
          className="rounded-full bg-gradient-to-r from-dusk-300 to-rose-400 px-5 py-1.5 text-xs font-semibold text-white shadow-sm shadow-rose-200 hover:opacity-90 disabled:opacity-50"
        >
          {isPending ? '저장 중…' : '저장'}
        </button>
      </div>
    </section>
  );
}
