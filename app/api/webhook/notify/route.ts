import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { parsePaymentText } from '@/lib/parser';
import type { WebhookResponse } from '@/types';

export const runtime = 'nodejs';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * POST /api/webhook/notify
 *
 * MacroDroid 등 헤더/JSON 설정이 어려운 앱을 위한 단순화 엔드포인트.
 * 시크릿·userId를 쿼리 파라미터로, 알림 텍스트를 plain text body로 전송.
 *
 * 예시:
 * POST https://your-app.vercel.app/api/webhook/notify?secret=XXX&userId=YYY
 * Content-Type: text/plain
 * Body: (카카오톡 알림 텍스트 원문)
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<WebhookResponse>> {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret') ?? '';
  const userId = searchParams.get('userId') ?? '';
  const expectedSecret = process.env.WEBHOOK_SECRET ?? '';

  // ① 시크릿 인증
  if (
    !expectedSecret ||
    secret.length !== expectedSecret.length ||
    !timingSafeEqual(secret, expectedSecret)
  ) {
    return NextResponse.json(
      { success: false, inserted: 0, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // ② userId 검증
  if (!UUID_REGEX.test(userId)) {
    return NextResponse.json(
      { success: false, inserted: 0, error: 'Invalid userId' },
      { status: 400 }
    );
  }

  // ③ 텍스트 읽기 (plain text body)
  const text = (await request.text()).trim();

  if (!text) {
    return NextResponse.json(
      { success: false, inserted: 0, error: 'Body is empty' },
      { status: 400 }
    );
  }
  if (text.length > 5000) {
    return NextResponse.json(
      { success: false, inserted: 0, error: 'Body too long' },
      { status: 400 }
    );
  }

  // ④ 패턴 파싱
  const transactions = parsePaymentText(text);

  if (transactions.length === 0) {
    return NextResponse.json({ success: true, inserted: 0, skipped: 0, transactions: [] });
  }

  // ⑤ upsert (중복 무시)
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
      console.error('[notify] DB error:', dbError);
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
    return NextResponse.json({
      success: true,
      inserted: insertedCount,
      skipped: transactions.length - insertedCount,
      transactions,
    });
  } catch (err) {
    console.error('[notify] Unexpected error:', err);
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
