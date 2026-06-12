import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { parsePaymentText } from '@/lib/parser';
import type { WebhookRequestBody, WebhookResponse } from '@/types';

export const runtime = 'nodejs';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * POST /api/webhook
 * 인증: X-Webhook-Secret 헤더
 * Body: { text: string, userId: string (UUID) }
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<WebhookResponse>> {
  // ① 공유 시크릿 인증
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
  if (text.length > 5000) {
    return NextResponse.json(
      { success: false, inserted: 0, error: '`text` exceeds 5000 character limit' },
      { status: 400 }
    );
  }
  if (typeof userId !== 'string' || !UUID_REGEX.test(userId)) {
    return NextResponse.json(
      { success: false, inserted: 0, error: '`userId` must be a valid UUID' },
      { status: 400 }
    );
  }

  // ④ 패턴 파싱
  const transactions = parsePaymentText(text.trim());

  if (transactions.length === 0) {
    return NextResponse.json({ success: true, inserted: 0, skipped: 0, transactions: [] });
  }

  // ⑤ upsert (중복 무시) — FK 제약이 유효하지 않은 userId를 거부
  try {
    const admin = createAdminClient();
    const rows = transactions.map((t) => ({ ...t, user_id: userId }));

    const { data: inserted, error: dbError } = await admin
      .from('transactions')
      .upsert(rows, {
        onConflict: 'user_id,card_company,approved_at,merchant,amount',
        ignoreDuplicates: true,
      })
      .select('id');

    if (dbError) {
      console.error('[webhook] DB upsert error:', dbError);
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

    const insertedCount = inserted?.length ?? 0;
    const skippedCount = transactions.length - insertedCount;

    return NextResponse.json({
      success: true,
      inserted: insertedCount,
      skipped: skippedCount,
      transactions,
    });
  } catch (err) {
    console.error('[webhook] Unexpected error:', err);
    return NextResponse.json(
      { success: false, inserted: 0, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function timingSafeEqual(a: string, b: string): boolean {
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
