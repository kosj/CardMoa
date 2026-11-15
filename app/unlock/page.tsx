import type { CSSProperties } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ArrowLeft, Lock } from 'lucide-react';
import {
  FAMILY_COOKIE,
  isFamilyGateConfigured,
  isValidFamilyCookie,
  safeNextPath,
} from '@/lib/family-gate';
import { GateDiary } from './GateDiary';
import { UnlockForm } from './UnlockForm';
import './unlock.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '가족 암호 · 은별이 대학생활 노트',
  robots: { index: false, follow: false },
};

const riseDelay = (ms: number) => ({ '--gate-delay': `${ms}ms` }) as CSSProperties;

export default async function UnlockPage({
  searchParams,
}: {
  searchParams: { next?: string | string[] };
}) {
  const rawNext = Array.isArray(searchParams.next) ? searchParams.next[0] : searchParams.next;
  const next = safeNextPath(rawNext);
  const configured = isFamilyGateConfigured();

  // 이미 열어 둔 기기라면 바로 노트로
  if (configured && (await isValidFamilyCookie(cookies().get(FAMILY_COOKIE)?.value))) {
    redirect(next);
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-gradient-to-b from-cream-50 via-cream-100 to-rose-100">
      {/* 카드 뒤의 은은한 노을빛 */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-24 h-72 w-72 -translate-x-1/2 rounded-full bg-dusk-300/30 blur-3xl sm:h-96 sm:w-96"
      />

      <main className="relative mx-auto flex min-h-screen w-full max-w-md flex-col justify-center break-keep px-4 py-10 sm:py-16">
        <section
          aria-labelledby="gate-title"
          className="gate-card-in gate-paper relative rounded-3xl bg-cream-50/95 px-6 pb-8 pt-7 text-center shadow-[0_24px_48px_-24px_rgba(231,124,77,0.35)] ring-1 ring-rose-100 sm:px-9 sm:pb-9 sm:pt-8"
        >
          <GateDiary className="mx-auto h-auto w-32 sm:w-36" />

          <p
            className="gate-rise mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-rose-500 ring-1 ring-rose-100"
            style={riseDelay(120)}
          >
            <Lock className="h-3 w-3" aria-hidden="true" />
            은별이 대학생활 노트
          </p>

          {configured ? (
            <>
              <h1
                id="gate-title"
                className="gate-rise mt-3 text-balance text-[1.35rem]/[1.45] font-bold tracking-tight text-gray-800 sm:text-2xl/[1.4]"
                style={riseDelay(180)}
              >
                가족만 열어볼 수 있는 노트예요
              </h1>
              <p className="gate-rise mt-2 text-sm leading-relaxed text-gray-500" style={riseDelay(240)}>
                가족 암호를 입력해 주세요.
                <br />
                한 번 열면 이 기기에서는 한동안 기억해 둘게요.
              </p>
              <div className="gate-rise" style={riseDelay(300)}>
                <UnlockForm next={next} />
              </div>
            </>
          ) : (
            <SetupNotice />
          )}
        </section>

        <div className="gate-rise mt-6 text-center" style={riseDelay(380)}>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm text-gray-500 transition-colors duration-base ease-soft hover:bg-white/60 hover:text-rose-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            처음 화면으로
          </Link>
        </div>
      </main>
    </div>
  );
}

/** FAMILY_PASSCODE가 없을 때: 폼 대신 설정 방법을 보여 주고 노트는 계속 잠가 둔다 */
function SetupNotice() {
  return (
    <>
      <h1
        id="gate-title"
        className="gate-rise mt-3 text-balance text-[1.35rem]/[1.45] font-bold tracking-tight text-gray-800 sm:text-2xl/[1.4]"
        style={riseDelay(180)}
      >
        아직 가족 암호가 정해지지 않았어요
      </h1>
      <p className="gate-rise mt-2 text-sm leading-relaxed text-gray-500" style={riseDelay(240)}>
        암호가 정해질 때까지 노트는 안전하게 잠겨 있어요.
        <br className="hidden sm:block" /> 아래 순서대로 한 번만 설정해 주세요.
      </p>

      <ol
        className="gate-rise mt-6 space-y-3 rounded-2xl bg-white/80 p-4 text-left text-sm leading-relaxed text-gray-600 ring-1 ring-cream-200 sm:p-5"
        style={riseDelay(300)}
      >
        <SetupStep n={1}>
          <b className="font-semibold text-gray-800">Vercel</b> 프로젝트 →{' '}
          <b className="font-semibold text-gray-800">Settings</b> →{' '}
          <b className="font-semibold text-gray-800">Environment Variables</b>
        </SetupStep>
        <SetupStep n={2}>
          이름은 <code className="gate-code">FAMILY_PASSCODE</code>, 값은 가족만 아는 암호로 넣어 주세요.
          <span className="mt-1 block text-xs text-gray-400">
            생일·전화번호처럼 짐작하기 쉬운 값은 피하고, 단어 몇 개를 이어 붙인 긴 암호를 추천해요.
          </span>
        </SetupStep>
        <SetupStep n={3}>
          저장한 뒤 <b className="font-semibold text-gray-800">Deployments</b>에서{' '}
          <b className="font-semibold text-gray-800">Redeploy</b>(다시 배포)를 눌러 주세요.
        </SetupStep>
      </ol>

      <p className="gate-rise mt-4 text-xs leading-relaxed text-gray-400" style={riseDelay(360)}>
        내 컴퓨터에서 개발할 때는 <code className="gate-code">.env.local</code>에 넣고 서버를 다시 켜면 돼요.
      </p>
    </>
  );
}

function SetupStep({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span
        aria-hidden="true"
        className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-dusk-300 to-rose-400 text-xs font-bold text-white"
      >
        {n}
      </span>
      <span>
        <span className="sr-only">{n}단계: </span>
        {children}
      </span>
    </li>
  );
}
