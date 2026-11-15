import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { GraduationCap } from 'lucide-react';
import { FAMILY_COOKIE, isValidFamilyCookie } from '@/lib/family-gate';
import { DashboardNav } from './components/DashboardNav';
import { LockButton } from './components/LockButton';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 미들웨어가 먼저 막지만, 혹시 미들웨어를 건너뛴 요청이 와도 화면은 그리지 않는다 (이중 잠금)
  if (!(await isValidFamilyCookie((await cookies()).get(FAMILY_COOKIE)?.value))) {
    redirect('/unlock?next=/dashboard');
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream-100 via-rose-50/40 to-cream-50">
      <header className="sticky top-0 z-10 bg-cream-50/85 backdrop-blur border-b border-rose-100/80">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="inline-flex shrink-0 items-center justify-center w-9 h-9 rounded-2xl bg-gradient-to-br from-dusk-300 to-rose-400 shadow-sm shadow-rose-200">
              <GraduationCap className="h-5 w-5 text-white" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-base font-bold text-gray-800">은별이 대학생활 노트</p>
              <p className="truncate text-xs text-gray-400">아빠가 늘 응원해 💖</p>
            </div>
          </div>
          <LockButton />
        </div>
        <DashboardNav />
      </header>

      {children}
    </div>
  );
}
