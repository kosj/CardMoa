import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { GraduationCap } from 'lucide-react';
import { SignOutButton } from './components/SignOutButton';
import { DashboardNav } from './components/DashboardNav';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50/70 via-pink-50/30 to-white">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-rose-100">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-2xl bg-gradient-to-br from-rose-400 to-pink-400 shadow-sm shadow-rose-200">
              <GraduationCap className="h-5 w-5 text-white" />
            </span>
            <div>
              <p className="text-base font-bold text-gray-800">고은별 대학생활 가계부</p>
              <p className="text-xs text-gray-400">{user.email}</p>
            </div>
          </div>
          <SignOutButton />
        </div>
        <DashboardNav />
      </header>

      {children}
    </div>
  );
}
