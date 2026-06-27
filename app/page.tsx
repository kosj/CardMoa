import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import {
  GraduationCap,
  Wallet,
  CalendarRange,
  PieChart,
  ArrowRight,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const ctaHref = user ? '/dashboard' : '/auth/login';
  const ctaLabel = user ? '가계부 열기' : '시작하기';

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-100 via-pink-50 to-white">
      <main className="mx-auto max-w-3xl px-6 py-20 sm:py-28">
        {/* 헤더 */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl mb-6 bg-gradient-to-br from-rose-400 to-pink-400 shadow-md shadow-rose-200">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>

          <p className="text-sm font-semibold text-rose-500 mb-2">
            우리 딸 고은별 대학생활 가계부 🎀
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 leading-tight">
            대학생 딸 <span className="text-rose-500">고은별</span>,<br />
            학교 다니며 드는 비용을 한눈에
          </h1>
          <p className="mt-5 text-base text-gray-500 leading-relaxed">
            카드 결제 알림과 수업료를 한곳에 모아 매달 얼마가 드는지 확인하는
            가계부예요. 해외 결제도 환율을 반영해 원화로 합산해 줍니다.
          </p>

          <div className="mt-8">
            <Link
              href={ctaHref}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-400 to-pink-400 px-7 py-3 text-sm font-semibold text-white shadow-md shadow-rose-200 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:ring-offset-2 transition-opacity"
            >
              {ctaLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* 기능 카드 */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Feature
            icon={<Wallet className="h-5 w-5 text-rose-400" />}
            title="카드 결제 자동 정리"
            desc="신한·롯데카드 결제 알림을 붙여넣으면 자동으로 내역에 추가돼요."
          />
          <Feature
            icon={<GraduationCap className="h-5 w-5 text-violet-400" />}
            title="수업료 합산"
            desc="등록금·수업료를 입력하면 전체 지출에 함께 합산됩니다."
          />
          <Feature
            icon={<CalendarRange className="h-5 w-5 text-pink-400" />}
            title="월별 지출 관리"
            desc="달마다 얼마를 썼는지 월별 메뉴에서 한눈에 살펴보세요."
          />
        </div>

        <div className="mt-4 grid grid-cols-1">
          <Feature
            icon={<PieChart className="h-5 w-5 text-fuchsia-400" />}
            title="지출 분포 한눈에"
            desc="가맹점·카드사·수업료별 지출 비중과 연간·월간 통계를 그래프로 보여줍니다."
          />
        </div>

        <p className="mt-16 text-center text-xs text-gray-400">
          고은별 학생의 슬기로운 대학생활을 응원합니다 💖
        </p>
      </main>
    </div>
  );
}

function Feature({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="bg-white rounded-3xl border border-rose-100 shadow-sm shadow-rose-100/40 p-5 text-left">
      <div className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-rose-50 mb-3">
        {icon}
      </div>
      <h3 className="text-sm font-bold text-gray-800">{title}</h3>
      <p className="mt-1 text-sm text-gray-500 leading-relaxed">{desc}</p>
    </div>
  );
}
