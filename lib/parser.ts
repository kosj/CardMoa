import type { ParsedTransaction } from '@/types';

const YEAR = new Date().getFullYear(); // 연도 미표기 시 현재 연도로 가정

/** MM/DD HH:mm → YYYY-MM-DD HH:mm:ss */
function toDateTime(monthDay: string, time: string): string {
  const [m, d] = monthDay.split('/');
  return `${YEAR}-${m.padStart(2, '0')}-${d.padStart(2, '0')} ${time}:00`;
}

function parseAmount(raw: string): number {
  return parseInt(raw.replace(/,/g, ''), 10) || 0;
}

/**
 * 신한 SOL트래블 해외승인 패턴
 *
 * SOL트래블해외승인 06/13 06:24
 * JPY 570 잔액JPY59,050 (JP)MCDONALD S
 */
function parseShinhan(text: string): ParsedTransaction[] {
  const results: ParsedTransaction[] = [];
  const re =
    /SOL트래블해외승인\s+(\d{1,2}\/\d{2})\s+(\d{2}:\d{2})\r?\n([A-Z]{3})\s+([\d,]+)\s+잔액[A-Z]{3}[\d,.]+\s+\([A-Z]+\)(.*)/g;

  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const amount = parseAmount(m[4]);
    if (amount <= 0) continue; // 0원 가승인 제외

    results.push({
      card_company: 'SHINHAN',
      approved_at: toDateTime(m[1], m[2]),
      currency: m[3],
      merchant: m[5].trim().slice(0, 200),
      amount,
    });
  }
  return results;
}

/**
 * 롯데 트립투로카(해외) 패턴
 *
 * AMAZON CO JP
 * JPY 0 해외승인
 * 고*종 트립투로카(6*2*)
 * 일시불, 06/12 02:32
 * 누적금액 814,558원
 */
function parseLotte(text: string): ParsedTransaction[] {
  const results: ParsedTransaction[] = [];
  const re =
    /([^\n\r]+)\r?\n([A-Z]{3})\s+([\d,]+)\s+해외승인\r?\n[^\n\r]*(?:트립투로카|롯데카드)[^\n\r]*\r?\n일시불,\s+(\d{1,2}\/\d{2})\s+(\d{2}:\d{2})\r?\n누적금액/g;

  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const amount = parseAmount(m[3]);
    if (amount <= 0) continue;

    const merchant = m[1].trim().slice(0, 200);
    if (!merchant) continue;

    results.push({
      card_company: 'LOTTE',
      approved_at: toDateTime(m[4], m[5]),
      currency: m[2],
      merchant,
      amount,
    });
  }
  return results;
}

/**
 * 텍스트에서 해외 결제 내역 파싱 (신한·롯데 패턴)
 * - 해외 결제만 수집 (외화 표기가 있는 건)
 * - amount ≤ 0인 가승인 건은 자동 제외
 */
export function parsePaymentText(text: string): ParsedTransaction[] {
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  return [...parseShinhan(normalized), ...parseLotte(normalized)];
}
