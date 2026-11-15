import { DashSkel, DashSkelHeart } from '../components/DashSkeleton';
import '../components/story.css';

// 스켈레톤 폴라로이드의 기울기·비율 — 실제 스크랩북처럼 들쭉날쭉하게
const POLAROIDS = [
  { tilt: -2.4, ratio: '3 / 4' },
  { tilt: 1.8, ratio: '3 / 4' },
  { tilt: -0.8, ratio: '4 / 3' },
  { tilt: 2.6, ratio: '3 / 4' },
  { tilt: -1.6, ratio: '2 / 3' },
  { tilt: 0.9, ratio: '3 / 4' },
];

export default function MemoriesLoading() {
  return (
    <main
      className="mx-auto max-w-4xl px-4 sm:px-6 py-8 space-y-6"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="sr-only">추억을 펼치는 중이에요</span>

      {/* 머리말 자리 */}
      <div className="rounded-3xl border border-cream-200 bg-gradient-to-br from-cream-100 via-cream-50 to-white p-5 shadow-sm shadow-rose-100/40 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="w-full max-w-xs space-y-3">
            <div className="flex items-center gap-2">
              <DashSkel className="h-8 w-8 rounded-xl" />
              <DashSkel className="h-5 w-24 rounded-full" delay={60} />
            </div>
            <DashSkel className="h-5 w-56 max-w-full rounded-full" delay={120} />
            <DashSkel className="h-5 w-44 max-w-full rounded-full" delay={180} />
            <DashSkel className="h-3 w-28 rounded-full" delay={240} />
          </div>
          <div className="flex h-24 w-24 shrink-0 items-center justify-center sm:h-28 sm:w-32">
            <DashSkelHeart label="추억을 펼치는 중…" iconClassName="h-7 w-7" />
          </div>
        </div>
      </div>

      {/* 스크랩북 자리 */}
      <div className="story-paper rounded-3xl border border-cream-200 px-4 pb-8 pt-7 shadow-sm shadow-rose-100/40 sm:px-8 sm:pt-9">
        <div className="flex items-center gap-2">
          <span className="h-4 w-4 shrink-0 rounded-full border-2 border-cream-300 bg-cream-50" />
          <DashSkel className="h-4 w-24 rounded-full" />
          <span aria-hidden="true" className="story-thread flex-1" />
        </div>
        <DashSkel className="ml-6 mt-2 h-3 w-28 rounded-full" delay={60} />

        <div className="mt-6 grid grid-cols-2 items-center gap-x-4 gap-y-7 sm:mt-7 sm:grid-cols-3 sm:gap-x-8 sm:gap-y-10">
          {POLAROIDS.map((p, i) => (
            <div
              key={i}
              className="rounded-[3px] bg-white p-[7px] pb-0 shadow-sm shadow-cream-300/70 sm:p-2.5 sm:pb-0"
              style={{ transform: `rotate(${p.tilt}deg)` }}
            >
              <DashSkel className="w-full rounded-[1px]" style={{ aspectRatio: p.ratio }} delay={i * 90} />
              <div className="flex justify-center py-3 sm:py-4">
                <DashSkel className="h-3 w-2/3 rounded-full" delay={i * 90 + 45} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
