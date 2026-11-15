import type { Transaction } from '@/types';
import { formatAmount, seoulDateParts, toKRW } from '@/lib/utils';

/** 캐릭터가 짓는 표정 = 이번 달 생활비 흐름에 맞춘 안부의 결 */
export type SpendingMood = 'empty' | 'great' | 'good' | 'normal' | 'warning' | 'alert';

export interface SpendingReview {
  mood: SpendingMood;
  /** 말풍선 상단 배지 (이모지 + 짧은 안부) */
  badge: string;
  /** 말풍선 메인 문장 */
  headline: string;
  /** 몇 초 간격으로 번갈아 보여줄 코멘트 (첫 줄은 안부) */
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
 * 이번 달(KST) 생활비를 최근 평균과 비교해 캐릭터가 건넬 안부 문구를 만든다.
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

  // 말투 원칙: 친구 같은 반말, 꾸짖거나 줄이라고 시키지 않는다. 숫자는 그대로 보여준다.
  switch (mood) {
    case 'empty':
      return {
        badge: '🌱 새로운 한 달',
        headline: `${monthLabel}엔 아직 결제가 없어. 가볍게, 천천히 시작해 보자!`,
      };
    case 'great':
      return {
        badge: '🌷 알뜰했네, 기특해',
        headline: `${monthLabel} 생활비 ${amount}. 평소보다 ${gap}% 아꼈네, 기특해!`,
      };
    case 'good':
      return {
        badge: '💚 잘 하고 있어',
        headline: `${monthLabel} 생활비 ${amount}. 평소보다 ${gap}% 덜 쓰면서 잘 지내고 있네.`,
      };
    case 'normal':
      return {
        badge: '☕ 평소 같은 한 달',
        headline:
          gap === null
            ? `${monthLabel} 생활비 ${amount}. 이번 달도 잘 지내 보자!`
            : `${monthLabel} 생활비 ${amount}. 평소랑 비슷하게 잘 지내고 있네.`,
      };
    case 'warning':
      return {
        badge: '🫶 조금 바빴나 봐',
        headline: `${monthLabel} 생활비 ${amount}. 평소보다 ${gap}% 더 들었네. 이것저것 필요한 게 많았나 봐.`,
      };
    case 'alert':
    default:
      return {
        badge: '🫂 무슨 일 있었어?',
        headline: `${monthLabel} 생활비 ${amount}. 평소보다 좀 더 썼네 — 무슨 일 있었어? 필요한 거 있으면 아빠한테 말해.`,
      };
  }
}

/** 등급별 안부 한마디 (아빠 말 전달은 등급당 최대 한 줄) */
const CARE_LINE: Record<Exclude<SpendingMood, 'empty'>, string> = {
  great: '아빠가 기특하대! 그래도 먹고 싶은 건 참지 말래 🌷',
  good: '아빠가 요즘 잘 지내는 것 같아서 마음 놓인대 💚',
  normal: '오늘 하루도 수고했어. 따뜻한 거 한 잔 마시면서 쉬어 ☕',
  warning: '밥은 잘 챙겨 먹고 있지? 무리하지 마 🫶',
  alert: '큰일 있었던 거면 혼자 끙끙대지 말고 꼭 얘기해 줘. 미쿠도 아빠도 네 편이야 🫂',
};

/** 받침 유무에 맞춰 '이었어' / '였어'를 고른다 (예: 쿠팡이었어, 스타벅스였어) */
function wasEnding(word: string): string {
  const chars = Array.from(word.trim());
  for (let i = chars.length - 1; i >= 0; i -= 1) {
    const ch = chars[i];
    const code = ch.charCodeAt(0);
    if (code >= 0xac00 && code <= 0xd7a3) {
      return (code - 0xac00) % 28 === 0 ? '였어' : '이었어';
    }
    // 숫자는 읽는 소리 기준 (0 영, 1 일, 3 삼, 6 육, 7 칠, 8 팔 → 받침 있음)
    if (/[0-9]/.test(ch)) return '013678'.includes(ch) ? '이었어' : '였어';
    if (/[A-Za-z]/.test(ch)) return '였어';
  }
  return '였어';
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
    lines.push('아빠가 이번 달도 응원한대. 하루하루 즐겁게 보내 🌱');
    lines.push('결제 알림이 들어오면 미쿠가 바로 정리해 둘게.');
    if (ctx.baseline !== null) {
      lines.push(
        `참고로 요즘 한 달 생활비는 평균 ${formatAmount(Math.round(ctx.baseline))} 정도였어.`
      );
    }
    return lines;
  }

  // 안부가 먼저, 숫자 이야기는 그 다음
  lines.push(CARE_LINE[ctx.mood]);

  lines.push(
    `${ctx.dayOfMonth}일까지 ${ctx.txCount}건 결제했고, 하루 평균 ${formatAmount(ctx.dailyAvg)} 정도 썼어.`
  );

  if (ctx.daysLeft > 0) {
    lines.push(
      `지금처럼 지내면 월말엔 ${formatAmount(ctx.projected)} 정도 될 것 같아.`
    );
  }

  if (ctx.topMerchant) {
    lines.push(
      `이번 달 단골집은 ${ctx.topMerchant.name}${wasEnding(ctx.topMerchant.name)} (${formatAmount(ctx.topMerchant.amount)})`
    );
  }

  if (ctx.baseline !== null) {
    lines.push(
      `최근 몇 달은 한 달에 평균 ${formatAmount(Math.round(ctx.baseline))} 정도 썼어.`
    );
  }

  return lines;
}
