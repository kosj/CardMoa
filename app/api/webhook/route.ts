import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { parsePaymentText } from '@/lib/gemini';
import type { WebhookRequestBody, WebhookResponse } from '@/types';

export const runtime = 'nodejs';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * POST /api/webhook
 *
 * 외부 앱(Android 매크로 등)에서 결제 알림 문자를 전송하면
 * Gemini AI로 파싱 후 transactions 테이블에 저장한다.
 *
 * 인증: X-Webhook-Secret 헤더에 환경변수 WEBHOOK_SECRET 값 포함 필요
 * Body: { text: string, userId: string (UUID) }
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<WebhookResponse>> {
  // ① 공유 시크릿으로 인증 — 타이밍 공격 방지를 위해 길이 무관 비교
  const incomingSecret = request.headers.get('x-webhook-secret') ?? '';
  const expectedSecret = process.env.WEBHOOK_SECRET ?? '';

  if (
    !expectedSecret ||
    incomingSecret.length !== expectedSecret.length ||
    !timingSafeEqual(incomingSecret, expectedSecret)
  ) {
    return NextResponse.json(
      { success: false, inserted: 0, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // ② 바디 파싱
  let body: WebhookRequestBody;
  try {
    body = (await request.json()) as WebhookRequestBody;
  } catch {
    return NextResponse.json(
      { success: false, inserted: 0, error: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  const { text, userId } = body;

  // ③ 입력값 검증
  if (typeof text !== 'string' || text.trim().length === 0) {
    return NextResponse.json(
      { success: false, inserted: 0, error: '`text` is required' },
      { status: 400 }
    );
  }
  if (text.length > 2000) {
    return NextResponse.json(
      { success: false, inserted: 0, error: '`text` exceeds 2000 character limit' },
      { status: 400 }
    );
  }
  if (typeof userId !== 'string' || !UUID_REGEX.test(userId)) {
    return NextResponse.json(
      { success: false, inserted: 0, error: '`userId` must be a valid UUID' },
      { status: 400 }
    );
  }

  // ④ AI 파싱
  let transactions;
  try {
    transactions = await parsePaymentText(text.trim());
  } catch (err) {
    console.error('[webhook] AI parse error:', err);
    return NextResponse.json(
      { success: false, inserted: 0, error: 'AI parsing failed' },
      { status: 502 }
    );
  }

  if (transactions.length === 0) {
    return NextResponse.json({ success: true, inserted: 0, transactions: [] });
  }

  // ⑤ 어드민 클라이언트로 INSERT
  //    FK 제약(user_id → auth.users.id)이 존재하지 않는 userId를 DB 레벨에서 거부함
  try {
    const admin = createAdminClient();
    const rows = transactions.map((t) => ({ ...t, user_id: userId }));

    const { error: dbError } = await admin.from('transactions').insert(rows);

    if (dbError) {
      console.error('[webhook] DB insert error:', dbError);
      // 23503 = foreign_key_violation (존재하지 않는 userId)
      const isNotFound = dbError.code === '23503';
      return NextResponse.json(
        {
          success: false,
          inserted: 0,
          error: isNotFound ? 'User not found' : 'Database error',
        },
        { status: isNotFound ? 404 : 500 }
      );
    }
  } catch (err) {
    console.error('[webhook] Unexpected error:', err);
    return NextResponse.json(
      { success: false, inserted: 0, error: 'Internal server error' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    inserted: transactions.length,
    transactions,
  });
}

/** 문자열 길이가 같을 때 타이밍 공격을 방지하는 상수 시간 비교 */
function timingSafeEqual(a: string, b: string): boolean {
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
