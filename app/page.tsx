import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';
import {
  Wallet,
  GraduationCap,
  CalendarHeart,
  ChartPie,
  MailOpen,
  Heart,
  ArrowRight,
} from 'lucide-react';
import { Reveal } from '@/app/components/motion';
import { FatherDaughterHero } from '@/app/components/landing/FatherDaughterHero';
import '@/app/components/landing/hero.css';

export const dynamic = 'force-dynamic';

/** 첫 화면 문구가 한 번만 순서대로 떠오르도록 지연(ms)을 넘긴다 */
const riseDelay = (ms: number) => ({ '--hero-delay': `${ms}ms` }) as CSSProperties;

export default function HomePage() {
  const ctaHref = '/dashboard';
  const ctaLabel = '생활 노트 열기';

  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-b from-cream-50 via-cream-100 to-rose-100">
      <main className="mx-auto max-w-6xl break-keep px-4 pb-16 pt-8 sm:px-6 sm:pt-12 lg:pt-20">
        {/* ── 히어로: 노을길 일러스트 + 아빠의 한마디 ───────── */}
        <section className="grid items-center gap-8 lg:grid-cols-[1fr_1.08fr] lg:gap-12">
          <div className="relative mx-auto w-full max-w-[560px] lg:order-2 lg:max-w-none">
            {/* 일러스트 뒤의 은은한 노을빛 */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-6 bottom-0 top-10 -z-0 rounded-full bg-dusk-300/30 blur-3xl"
            />
            <div className="hero-art-in relative drop-shadow-[0_18px_30px_rgba(231,124,77,0.16)]">
              <FatherDaughterHero />
            </div>
          </div>

          <div className="text-center lg:order-1 lg:text-left">
            <p
              className="hero-rise inline-flex items-center rounded-full bg-white/70 px-3.5 py-1 text-sm font-semibold text-rose-500 ring-1 ring-rose-100"
              style={riseDelay(80)}
            >
              아빠가 만든 은별이의 대학생활 노트 🎀
            </p>
            <h1
              className="hero-rise mt-5 text-[1.9rem]/[1.4] font-bold tracking-tight text-gray-800 sm:text-4xl/[1.36] lg:text-[2.75rem]/[1.32]"
              style={riseDelay(180)}
            >
              <span className="text-rose-500">은별아</span>, 학교생활은
              <br />
              아빠가 함께 챙길게
            </h1>
            <p
              className="hero-rise mx-auto mt-5 max-w-md text-base leading-relaxed text-gray-600 lg:mx-0"
              style={riseDelay(300)}
            >
              카드 결제와 수업료를 한곳에 모아 매달 생활비를 정리해 둘게. 해외에서
              쓴 돈도 원화로 바꿔서 보여줄게.
            </p>

            <div className="hero-rise mt-8" style={riseDelay(420)}>
              <Link
                href={ctaHref}
                className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-400 to-pink-400 px-7 py-3.5 text-sm font-semibold text-white shadow-md shadow-rose-200 transition-[opacity,box-shadow] duration-base ease-soft hover:opacity-95 hover:shadow-lg hover:shadow-rose-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 focus-visible:ring-offset-2 focus-visible:ring-offset-cream-50"
              >
                {ctaLabel}
                <ArrowRight className="h-4 w-4 transition-transform duration-base ease-soft group-hover:translate-x-0.5 motion-reduce:transition-none" />
              </Link>
            </div>
          </div>
        </section>

        {/* ── 노트에 담긴 것들 ───────────────────── */}
        <section className="mx-auto mt-20 max-w-4xl sm:mt-24">
          <Reveal>
            <h2 className="text-center text-lg font-bold text-gray-800 sm:text-xl">
              은별이 노트에는 이런 게 있어
            </h2>
            <p className="mt-1.5 text-center text-sm text-gray-500">
              신경 쓸 일은 아빠가 덜어 줄게. 은별이는 학교생활에 집중해.
            </p>
          </Reveal>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Reveal delay={0} className="h-full">
              <Feature
                icon={<Wallet className="h-5 w-5 text-rose-400" />}
                tint="bg-rose-50"
                title="카드 결제 자동 정리"
                desc="신한·롯데카드 결제 알림이 오면 자동으로 기록돼. 영수증 하나하나 챙기지 않아도 괜찮아."
              />
            </Reveal>
            <Reveal delay={90} className="h-full">
              <Feature
                icon={<GraduationCap className="h-5 w-5 text-violet-400" />}
                tint="bg-violet-50"
                title="등록금·수업료 합산"
                desc="등록금과 수업료도 생활비에 함께 더해서, 한 학기에 드는 돈을 한 번에 볼 수 있어."
              />
            </Reveal>
            <Reveal delay={180} className="h-full">
              <Feature
                icon={<CalendarHeart className="h-5 w-5 text-pink-400" />}
                tint="bg-pink-50"
                title="달마다 생활비 기록"
                desc="이번 달엔 얼마가 들었는지, 달마다 차곡차곡 정리해 둘게."
              />
            </Reveal>
            <Reveal delay={270} className="h-full">
              <Feature
                icon={<ChartPie className="h-5 w-5 text-fuchsia-400" />}
                tint="bg-fuchsia-50"
                title="생활비 흐름 그래프"
                desc="생활비가 어디에 쓰였는지, 카드별·수업료별 비중과 달마다 흐름을 그래프로 보여줄게."
              />
            </Reveal>
            <Reveal delay={360} className="h-full sm:col-span-2 lg:col-span-2">
              <LetterFeature />
            </Reveal>
          </div>
        </section>

        <Reveal>
          <p className="mt-16 text-center text-sm text-gray-500">
            은별이의 슬기로운 대학생활을 늘 응원해 💖
            <span className="mt-1 block text-xs text-gray-400 sm:ml-1.5 sm:mt-0 sm:inline">
              — 아빠가
            </span>
          </p>
        </Reveal>
      </main>
    </div>
  );
}

function Feature({
  icon,
  tint,
  title,
  desc,
}: {
  icon: ReactNode;
  tint: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="h-full rounded-3xl border border-rose-100/80 bg-white/85 p-5 text-left shadow-sm shadow-rose-100/40">
      <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl ${tint}`}>
        {icon}
      </div>
      <h3 className="text-sm font-bold text-gray-800">{title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-gray-500">{desc}</p>
    </div>
  );
}

/** 새 기능 '아빠의 쪽지' — 편지 봉투 느낌의 카드 */
function LetterFeature() {
  return (
    <div className="relative h-full overflow-hidden rounded-3xl border border-dusk-300/50 bg-cream-50 p-5 text-left shadow-sm shadow-dusk-300/20 sm:p-6">
      {/* 편지지 안쪽 점선 테두리 */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-2 rounded-[1.25rem] border border-dashed border-dusk-300/60"
      />
      <div className="relative flex h-full items-center gap-4">
        <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-dusk-300/25">
          <MailOpen className="h-5 w-5 text-dusk-500" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-gray-800">아빠의 쪽지 💌</h3>
          <p className="mt-1 text-sm leading-relaxed text-gray-600">
            아빠가 남긴 쪽지를 열어볼 수 있어. 지치는 날엔 한 번씩 열어 봐.
          </p>
        </div>
        {/* 봉인 스티커 */}
        <div
          aria-hidden="true"
          className="hidden h-14 w-14 shrink-0 -rotate-6 items-center justify-center rounded-full bg-gradient-to-br from-rose-300 to-dusk-400 shadow-md shadow-dusk-300/40 ring-4 ring-white/70 sm:inline-flex"
        >
          <Heart className="h-6 w-6 text-white" fill="currentColor" />
        </div>
      </div>
    </div>
  );
}
