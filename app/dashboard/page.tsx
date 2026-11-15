import { getAppUserId } from '@/lib/app-user';
import { getExchangeRates } from '@/lib/exchange';
import { listMemoriesWithUrls } from '@/lib/memories';
import { memoryDateKey, type Memory } from '@/lib/memory-types';
import { getAppAbroadInfo, getAppIncludeDomestic, getAppMikuMemoryId } from '@/lib/settings';
import { getTransactions } from '@/lib/transactions';
import { AbroadBanner } from './components/AbroadBanner';
import { DadLetterSection } from './components/DadLetterSection';
import { PaymentTextParser } from './components/PaymentTextParser';
import { SpendingCoach } from './components/SpendingCoach';
import { StatsDashboard } from './components/StatsDashboard';
import { TuitionForm } from './components/TuitionForm';

export const dynamic = 'force-dynamic';

/** 추억 사진 (미쿠 카드 뒷면·사진 고르기용) — 실패해도 대시보드는 그대로 열린다 */
async function loadMemories(): Promise<Memory[]> {
  try {
    const userId = await getAppUserId();
    if (!userId) return [];
    return await listMemoriesWithUrls(userId);
  } catch (err) {
    console.error('[dashboard] 추억 사진 불러오기 예외:', err);
    return [];
  }
}

export default async function DashboardPage() {
  const [tx, exchangeRates, includeDomestic, abroad, memories, mikuMemoryId] =
    await Promise.all([
      getTransactions(1000),
      getExchangeRates(),
      getAppIncludeDomestic(),
      getAppAbroadInfo(),
      loadMemories(),
      getAppMikuMemoryId(),
    ]);
  const todayKey = memoryDateKey(new Date().toISOString());

  return (
    <main className="mx-auto max-w-4xl px-4 sm:px-6 py-8 space-y-6">
      {/* 바다 건너 D-day — 떨어져 지낸 날과 다음 만남 */}
      <AbroadBanner info={abroad} todayKey={todayKey} />

      {/* 아빠가 보낸 쪽지 — 대시보드에서 가장 먼저 보이는 자리 */}
      <DadLetterSection memories={memories} />

      {/* 미쿠의 이번 달 안부 — 미쿠를 누르면 (가족이 고른 사진이 있을 때만) 카드가 뒤집힌다 */}
      <SpendingCoach
        transactions={tx}
        exchangeRates={exchangeRates}
        memories={memories}
        mikuMemoryId={mikuMemoryId}
      />

      {/* 생활비 통계 */}
      <StatsDashboard transactions={tx} exchangeRates={exchangeRates} />

      {/* 아빠가 쓰는 입력 도구 — 담백하게 아래쪽에 */}
      <TuitionForm />

      <PaymentTextParser includeDomestic={includeDomestic} />
    </main>
  );
}
