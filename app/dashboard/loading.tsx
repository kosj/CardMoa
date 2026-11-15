import { DashSkel, DashSkelCard, DashSkelHeart } from './components/DashSkeleton';

// 월별 막대 자리 — 실제 차트처럼 들쭉날쭉하게
const BAR_HEIGHTS = [38, 52, 30, 64, 46, 72, 40, 58, 34, 66, 50, 44];

export default function DashboardLoading() {
  return (
    <main
      className="mx-auto max-w-4xl px-4 sm:px-6 py-8 space-y-6"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="sr-only">은별이 기록을 불러오는 중이에요</span>

      {/* 코치(히어로) 자리 */}
      <DashSkelCard className="p-5 sm:p-6 bg-gradient-to-br from-cream-50 via-white to-rose-50/60">
        <div className="flex flex-col sm:flex-row items-center gap-5">
          <div className="flex h-36 w-36 shrink-0 items-center justify-center rounded-full bg-cream-100/80">
            <DashSkelHeart label="기록을 펼치는 중…" />
          </div>
          <div className="w-full flex-1 space-y-3">
            <DashSkel className="h-4 w-24 rounded-full" />
            <DashSkel className="h-5 w-3/4 rounded-full" delay={60} />
            <DashSkel className="h-5 w-2/3 rounded-full" delay={120} />
            <DashSkel className="h-16 w-full rounded-2xl" delay={180} />
          </div>
        </div>
      </DashSkelCard>

      {/* 요약 카드 4개 자리 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-rose-100 bg-white/80 px-4 py-3.5 shadow-sm shadow-rose-100/40"
          >
            <DashSkel className="h-3 w-20 rounded-full" delay={i * 80} />
            <DashSkel className="mt-3 h-5 w-24 max-w-full rounded-full" delay={i * 80 + 40} />
          </div>
        ))}
      </div>

      {/* 달마다 생활비 자리 */}
      <DashSkelCard className="p-5">
        <div className="mb-5 flex items-center justify-between">
          <DashSkel className="h-4 w-24 rounded-full" />
          <DashSkel className="h-4 w-20 rounded-full" delay={60} />
        </div>
        <div className="flex h-52 items-end gap-1.5 sm:gap-3 px-1 sm:px-2">
          {BAR_HEIGHTS.map((h, i) => (
            <DashSkel
              key={i}
              className="flex-1 rounded-t-md"
              style={{ height: `${h}%` }}
              delay={i * 40}
            />
          ))}
        </div>
      </DashSkelCard>

      {/* 자주 간 곳 · 카드별 사용 자리 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <DashSkelCard className="p-5">
          <DashSkel className="h-4 w-20 rounded-full" />
          <DashSkel className="mt-2 h-3 w-28 rounded-full" delay={60} />
          <div className="relative mx-auto mt-6 h-40 w-40">
            <DashSkel className="h-full w-full rounded-full" delay={120} />
            <div className="absolute inset-[22%] rounded-full bg-white" />
          </div>
        </DashSkelCard>
        <DashSkelCard className="p-5">
          <DashSkel className="h-4 w-20 rounded-full" />
          <DashSkel className="mt-2 h-3 w-12 rounded-full" delay={60} />
          <div className="mt-6 space-y-5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between">
                  <DashSkel className="h-3.5 w-16 rounded-full" delay={120 + i * 80} />
                  <DashSkel className="h-3.5 w-20 rounded-full" delay={160 + i * 80} />
                </div>
                <DashSkel className="h-2 w-full rounded-full" delay={200 + i * 80} />
              </div>
            ))}
          </div>
        </DashSkelCard>
      </div>
    </main>
  );
}
