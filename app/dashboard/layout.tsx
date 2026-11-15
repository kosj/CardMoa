import { GraduationCap } from 'lucide-react';
import { DashboardNav } from './components/DashboardNav';

export const dynamic = 'force-dynamic';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-cream-100 via-rose-50/40 to-cream-50">
      <header className="sticky top-0 z-10 bg-cream-50/85 backdrop-blur border-b border-rose-100/80">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-2xl bg-gradient-to-br from-dusk-300 to-rose-400 shadow-sm shadow-rose-200">
              <GraduationCap className="h-5 w-5 text-white" />
            </span>
            <div>
              <p className="text-base font-bold text-gray-800">은별이 대학생활 노트</p>
              <p className="text-xs text-gray-400">아빠가 늘 응원해 💖</p>
            </div>
          </div>
        </div>
        <DashboardNav />
      </header>

      {children}
    </div>
  );
}
