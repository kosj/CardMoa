import { DashSkel, DashSkelHeart } from '../components/DashSkeleton';

const ROWS = [0, 1, 2, 3, 4, 5];
// 가맹점 이름 길이가 제각각인 것처럼
const MERCHANT_WIDTHS = ['w-40', 'w-28', 'w-48', 'w-32', 'w-44', 'w-24'];

export default function TransactionsLoading() {
  return (
    <main
      className="mx-auto max-w-4xl px-4 sm:px-6 py-8 space-y-6"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="sr-only">은별이 생활 기록을 불러오는 중이에요</span>

      <section className="overflow-hidden rounded-3xl border border-rose-100 bg-white/80 shadow-sm shadow-rose-100/40">
        {/* 헤더 */}
        <div className="border-b border-rose-50 bg-gradient-to-r from-rose-50/60 to-pink-50/60 px-5 sm:px-6 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <DashSkelHeart iconClassName="h-5 w-5" />
              <DashSkel className="h-4 w-28 rounded-full" />
              <DashSkel className="h-5 w-10 rounded-full" delay={60} />
            </div>
            <DashSkel className="h-5 w-28 sm:w-32 rounded-full" delay={120} />
          </div>
          <DashSkel className="mt-3 h-3 w-48 rounded-full" delay={180} />
        </div>

        {/* 행 */}
        <ul className="divide-y divide-rose-50">
          {ROWS.map((i) => (
            <li
              key={i}
              className="flex items-center justify-between gap-3 px-5 sm:px-6 py-4"
            >
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <DashSkel className="h-4 w-10 rounded-full" delay={i * 70} />
                  <DashSkel className="h-3 w-28 rounded-full" delay={i * 70 + 30} />
                </div>
                <DashSkel
                  className={`h-4 max-w-full rounded-full ${MERCHANT_WIDTHS[i]}`}
                  delay={i * 70 + 60}
                />
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <DashSkel className="h-4 w-20 rounded-full" delay={i * 70 + 90} />
                <DashSkel className="h-3 w-8 rounded" delay={i * 70 + 120} />
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
