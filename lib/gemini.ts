import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ParsedTransaction } from '@/types';

const PARSE_PROMPT = `입력된 텍스트에서 카드 결제 정보를 추출하라.

추출 규칙:
- card_company: "SHINHAN"(신한카드), "LOTTE"(롯데카드), 나머지는 "UNKNOWN"
- approved_at: "YYYY-MM-DD HH:mm:ss" 형식. 연도가 없으면 2026년으로 가정
- merchant: 가맹점명 문자열 (원본 그대로)
- amount: 결제 금액을 순수 숫자만 반환 (원화 기호, 쉼표 제거)

반드시 아래 JSON 배열 형식으로만 응답하라. 설명이나 마크다운 없이 JSON만 반환하라:
[{"card_company":"SHINHAN","approved_at":"2026-06-11 14:30:00","merchant":"스타벅스","amount":5500}]

결제 정보를 찾을 수 없으면 빈 배열 []을 반환하라.`;

export async function parsePaymentText(text: string): Promise<ParsedTransaction[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0,
    },
  });

  const result = await model.generateContent(
    `${PARSE_PROMPT}\n\n---\n${text}`
  );
  const raw = result.response.text().trim();

  // 모델이 마크다운 코드 블록을 감싸는 경우 제거
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
  // YYYY-MM-DD HH:mm:ss 또는 YYYY-MM-DDTHH:mm:ss 허용
  if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}/.test(value)) {
    return value.replace('T', ' ').slice(0, 19);
  }
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}
