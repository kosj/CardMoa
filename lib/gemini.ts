import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ParsedTransaction } from '@/types';

const PARSE_PROMPT = `입력된 텍스트에서 카드 결제 정보를 추출하라.

추출 규칙:
- card_company: "SHINHAN"(신한카드), "LOTTE"(롯데/트립투로카 등 롯데카드 계열), 나머지는 "UNKNOWN"
- approved_at: "YYYY-MM-DD HH:mm:ss" 형식. 연도가 없으면 2026년으로 가정
- merchant: 가맹점명 문자열 (원본 그대로)
- amount: 이번 건의 실제 결제 금액(순수 숫자, 통화기호·쉼표 제거).
  중요: "누적금액"·"누적"·"이용누계"는 합산 표시일 뿐 결제 금액이 아니므로 절대 사용하지 마라.
  해외승인 등으로 금액이 0이면 amount는 0으로 둔다.

반드시 아래 JSON 배열 형식으로만 응답하라. 설명이나 마크다운 없이 JSON만 반환하라:
[{"card_company":"SHINHAN","approved_at":"2026-06-11 14:30:00","merchant":"스타벅스","amount":5500}]

결제 정보를 찾을 수 없으면 빈 배열 []을 반환하라.`;

// 우선순위 순 모델 목록. GEMINI_MODEL 환경변수로 첫 번째 모델을 재정의 가능.
const MODEL_FALLBACK_CHAIN = [
  process.env.GEMINI_MODEL ?? 'gemini-2.0-flash-lite',
  'gemini-2.0-flash',
  'gemini-1.5-flash-8b',
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function is5xx(detail: string) {
  return /\b5\d{2}\b|Service Unavailable|overloaded|UNAVAILABLE/i.test(detail);
}

function is429(detail: string) {
  return /\b429\b|Too Many Requests|quota|RESOURCE_EXHAUSTED/i.test(detail);
}

/** 단일 모델 호출 — 503 등 일시 오류는 최대 3회 지수 백오프 재시도 */
async function callModel(
  genAI: GoogleGenerativeAI,
  modelName: string,
  prompt: string
): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: { responseMimeType: 'application/json', temperature: 0 },
  });

  let lastErr = '';
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      return result.response.text().trim();
    } catch (err) {
      lastErr = err instanceof Error ? err.message : String(err);
      if (is5xx(lastErr) && attempt < 2) {
        await sleep(2000 * 2 ** attempt); // 2s → 4s → 8s
        continue;
      }
      throw err;
    }
  }
  throw new Error(lastErr);
}

export async function parsePaymentText(text: string): Promise<ParsedTransaction[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY 환경변수가 설정되지 않았습니다.');

  const genAI = new GoogleGenerativeAI(apiKey);
  const prompt = `${PARSE_PROMPT}\n\n---\n${text}`;

  let raw = '';
  let lastErr = '';

  // 모델 체인 순서로 시도 — 429/5xx 모두 다음 모델로 폴백
  for (const modelName of MODEL_FALLBACK_CHAIN) {
    try {
      raw = await callModel(genAI, modelName, prompt);
      break; // 성공 시 루프 탈출
    } catch (err) {
      lastErr = err instanceof Error ? err.message : String(err);

      if (is429(lastErr) || is5xx(lastErr)) {
        // 다음 모델로 폴백
        console.warn(`[gemini] ${modelName} 실패, 다음 모델로 전환:`, lastErr.slice(0, 120));
        continue;
      }

      // 그 외(인증 실패, 모델 단종 등) — 즉시 중단
      throw new Error(`Gemini API 호출 실패 (model=${modelName}): ${lastErr}`);
    }
  }

  if (!raw) {
    if (is429(lastErr)) {
      throw new Error(
        '모든 Gemini 모델의 무료 할당량을 초과했습니다. ' +
          'Google AI Studio에서 결제(billing)를 활성화하거나 잠시 후 다시 시도해주세요.'
      );
    }
    throw new Error(`Gemini API 호출 실패 (모든 모델 시도 후): ${lastErr}`);
  }

  // 마크다운 코드 블록 제거
  const cleaned = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/, '')
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return [];
  }

  if (!Array.isArray(parsed)) return [];

  return parsed
    .filter((item): item is Record<string, unknown> =>
      typeof item === 'object' && item !== null
    )
    .map((item) => ({
      card_company: normalizeCardCompany(item.card_company),
      approved_at: normalizeDate(String(item.approved_at ?? '')),
      merchant: String(item.merchant ?? '').trim().slice(0, 200),
      amount: Math.abs(Number(item.amount ?? 0)),
    }))
    .filter((t) => t.merchant.length > 0 && t.amount > 0);
}

function normalizeCardCompany(value: unknown): 'SHINHAN' | 'LOTTE' | 'UNKNOWN' {
  if (value === 'SHINHAN' || value === 'LOTTE') return value;
  return 'UNKNOWN';
}

function normalizeDate(value: string): string {
  if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}/.test(value)) {
    return value.replace('T', ' ').slice(0, 19);
  }
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}
