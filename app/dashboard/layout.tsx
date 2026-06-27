import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
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
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-gray-200">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-base font-bold text-gray-900">고은별 대학생활 가계부</p>
            <p className="text-xs text-gray-400">{user.email}</p>
          </div>
          <SignOutButton />
        </div>
        <DashboardNav />
      </header>

      {children}
    </div>
  );
}
