/**
 * KRW 기준 환율 조회 (1 외화 = X 원). 1시간 캐시.
 * 서버 컴포넌트에서 사용.
 */
export async function getExchangeRates(): Promise<Record<string, number>> {
  try {
    const res = await fetch(
      'https://api.frankfurter.app/latest?from=KRW&to=JPY,USD,EUR,GBP,CNY,HKD,THB',
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return {};
    const data = (await res.json()) as { rates: Record<string, number> };
    // data.rates: 1 KRW = X 외화 → 뒤집어서 1 외화 = X 원
    const krwPer: Record<string, number> = {};
    for (const [currency, rate] of Object.entries(data.rates)) {
      krwPer[currency] = Math.round(1 / rate);
    }
    return krwPer;
  } catch {
    return {};
  }
}
