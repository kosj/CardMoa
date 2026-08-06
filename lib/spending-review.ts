import type { Transaction } from '@/types';
import { formatAmount, seoulDateParts, toKRW } from '@/lib/utils';

/** 캐릭터가 짓는 표정 = 이번 달 지출에 대한 평가 등급 */
export type SpendingMood = 'empty' | 'great' | 'good' | 'normal' | 'warning' | 'alert';

export interface SpendingReview {
  mood: SpendingMood;
  /** 말풍선 상단 배지 (이모지 + 한 단어 평가) */
  badge: string;
  /** 말풍선 메인 문장 */
  headline: string;
  /** 몇 초 간격으로 번갈아 보여줄 코멘트 */
  lines: string[];
  monthLabel: string;
  monthTotal: number;
  txCount: number;
  /** 최근 몇 달 평균 대비 증감률 (%). 비교할 과거 데이터가 없으면 null */
  diffPct: number | null;
  baseline: number | null;
  /** 지금 속도로 갔을 때의 월말 예상 지출 */
  projected: number;
  topMerchant: { name: string; amount: number } | null;
}

/** 평균을 낼 때 참고하는 과거 개월 수 */
const BASELINE_MONTHS = 6;

const monthIndex = (year: number, month: number) => year * 12 + (month - 1);

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/**
 * 이번 달(KST) 지출을 최근 평균과 비교해 캐릭터가 말할 평가 문구를 만든다.
 */
export function buildSpendingReview(
  transactions: Transaction[],
  exchangeRates: Record<string, number>,
  now: Date = new Date()
): SpendingReview {
  const today = seoulDateParts(now.toISOString());
  const currentKey = monthIndex(today.year, today.month);
  const monthLabel = `${today.month}월`;

  const totals = new Map<number, number>();
  const counts = new Map<number, number>();
  const merchants = new Map<string, number>();

  for (const t of transactions) {
    const { year, month } = seoulDateParts(t.approved_at);
    const key = monthIndex(year, month);
    const krw = toKRW(t.amount, t.currency, exchangeRates);
    totals.set(key, (totals.get(key) ?? 0) + krw);
    counts.set(key, (counts.get(key) ?? 0) + 1);
    if (key === currentKey) {
      merchants.set(t.merchant, (merchants.get(t.merchant) ?? 0) + krw);
    }
  }

  const monthTotal = totals.get(currentKey) ?? 0;
  const txCount = counts.get(currentKey) ?? 0;

  // 직전 N개월 중 지출이 있었던 달만 평균에 반영
  const past: number[] = [];
  for (let i = 1; i <= BASELINE_MONTHS; i += 1) {
    const value = totals.get(currentKey - i);
    if (value && value > 0) past.push(value);
  }
  const baseline =
    past.length > 0 ? past.reduce((s, v) => s + v, 0) / past.length : null;
  const diffPct =
    baseline && baseline > 0 ? (monthTotal / baseline - 1) * 100 : null;

  const total = daysInMonth(today.year, today.month);
  const projected = Math.round((monthTotal / today.day) * total);
  const dailyAvg = Math.round(monthTotal / today.day);

  const topEntry = Array.from(merchants.entries()).sort((a, b) => b[1] - a[1])[0];
  const topMerchant = topEntry ? { name: topEntry[0], amount: topEntry[1] } : null;

  const mood = pickMood(monthTotal, diffPct);
  const { badge, headline } = pickHeadline(mood, monthLabel, monthTotal, diffPct);

  return {
    mood,
    badge,
    headline,
    lines: buildLines({
      mood,
      monthLabel,
      monthTotal,
      txCount,
      diffPct,
      baseline,
      projected,
      dailyAvg,
      topMerchant,
      dayOfMonth: today.day,
      daysLeft: total - today.day,
    }),
    monthLabel,
    monthTotal,
    txCount,
    diffPct,
    baseline,
    projected,
    topMerchant,
  };
}

function pickMood(monthTotal: number, diffPct: number | null): SpendingMood {
  if (monthTotal <= 0) return 'empty';
  if (diffPct === null) return 'normal';
  if (diffPct <= -30) return 'great';
  if (diffPct <= -10) return 'good';
  if (diffPct <= 10) return 'normal';
  if (diffPct <= 40) return 'warning';
  return 'alert';
}

function pickHeadline(
  mood: SpendingMood,
  monthLabel: string,
  monthTotal: number,
  diffPct: number | null
): { badge: string; headline: string } {
  const amount = formatAmount(monthTotal);
  const gap = diffPct === null ? null : Math.abs(Math.round(diffPct));

  switch (mood) {
    case 'empty':
      return {
        badge: '🌱 시작 전',
        headline: `${monthLabel}엔 아직 쓴 게 없어요. 깨끗한 출발이에요!`,
      };
    case 'great':
      return {
        badge: '🏆 아주 잘했어요',
        headline: `${monthLabel} 지출 ${amount}. 평소보다 ${gap}%나 아꼈어요!`,
      };
    case 'good':
      return {
        badge: '💚 좋아요',
        headline: `${monthLabel} 지출 ${amount}. 평균보다 ${gap}% 적게 쓰고 있어요.`,
      };
    case 'normal':
      return {
        badge: '🙂 무난해요',
        headline:
          gap === null
            ? `${monthLabel} 지출은 ${amount}예요. 이 페이스 기억해 둘게요!`
            : `${monthLabel} 지출 ${amount}. 평소랑 비슷한 흐름이에요.`,
      };
    case 'warning':
      return {
        badge: '⚠️ 조금 과했어요',
        headline: `${monthLabel} 지출 ${amount}. 평균보다 ${gap}% 더 썼어요.`,
      };
    case 'alert':
    default:
      return {
        badge: '🚨 지출 경보',
        headline: `${monthLabel} 지출 ${amount}! 평균보다 ${gap}%나 많아요.`,
      };
  }
}

function buildLines(ctx: {
  mood: SpendingMood;
  monthLabel: string;
  monthTotal: number;
  txCount: number;
  diffPct: number | null;
  baseline: number | null;
  projected: number;
  dailyAvg: number;
  topMerchant: { name: string; amount: number } | null;
  dayOfMonth: number;
  daysLeft: number;
}): string[] {
  const lines: string[] = [];

  if (ctx.mood === 'empty') {
    lines.push('결제 알림을 붙여넣으면 바로 정리해 줄게요.');
    if (ctx.baseline !== null) {
      lines.push(`참고로 최근 월 평균은 ${formatAmount(Math.round(ctx.baseline))}였어요.`);
    }
    lines.push('이번 달도 같이 잘 지켜봐요! 💪');
    return lines;
  }

  lines.push(
    `${ctx.dayOfMonth}일까지 ${ctx.txCount}건 결제, 하루 평균 ${formatAmount(ctx.dailyAvg)}예요.`
  );

  if (ctx.daysLeft > 0) {
    lines.push(
      `이 속도라면 월말엔 ${formatAmount(ctx.projected)} 정도가 될 것 같아요.`
    );
  }

  if (ctx.topMerchant) {
    lines.push(
      `이번 달 1등 가맹점은 ${ctx.topMerchant.name} (${formatAmount(ctx.topMerchant.amount)})!`
    );
  }

  if (ctx.baseline !== null) {
    lines.push(`최근 월 평균은 ${formatAmount(Math.round(ctx.baseline))}였어요.`);
  }

  switch (ctx.mood) {
    case 'great':
      lines.push('이번 달은 정말 알뜰했어요. 이대로만 가요! 🎉');
      break;
    case 'good':
      lines.push('꾸준히 잘 관리하고 있어요. 계속 이 느낌으로! 👍');
      break;
    case 'normal':
      lines.push('큰 흔들림 없이 잘 가고 있어요. 남은 날도 화이팅!');
      break;
    case 'warning':
      lines.push('남은 날은 조금만 아껴볼까요? 배달·카페부터 점검해요.');
      break;
    case 'alert':
    default:
      lines.push('큰 지출이 있었나 봐요. 내역을 한 번 확인해 봐요!');
      break;
  }

  return lines;
}
