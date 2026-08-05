import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { APP_USER_EMAIL, getAppUserId } from '@/lib/app-user';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/debug?secret=WEBHOOK_SECRET
 * 데이터가 안 보이는 원인을 진단하기 위한 임시 엔드포인트.
 * WEBHOOK_SECRET으로 보호. 확인 후 삭제 예정.
 */
export async function GET(request: NextRequest) {
  const secret = new URL(request.url).searchParams.get('secret') ?? '';
  const expected = process.env.WEBHOOK_SECRET ?? '';
  if (!expected || secret !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const env = {
    hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    appUserEmail: APP_USER_EMAIL,
    appUserIdEnv: process.env.APP_USER_ID ?? null,
  };

  let resolvedUserId: string | null = null;
  let txCountForUser: number | null = null;
  let totalTxCount: number | null = null;
  let usersSummary: Array<{ email: string | undefined; id: string; txCount: number }> = [];
  let errorMsg: string | null = null;

  try {
    resolvedUserId = await getAppUserId();

    const admin = createAdminClient();

    // 전체 내역 수
    const totalRes = await admin
      .from('transactions')
      .select('*', { count: 'exact', head: true });
    totalTxCount = totalRes.count ?? null;

    // 해결된 userId의 내역 수
    if (resolvedUserId) {
      const userRes = await admin
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', resolvedUserId);
      txCountForUser = userRes.count ?? null;
    }

    // 계정별 내역 분포 (어느 계정에 데이터가 있는지 확인)
    const { data: users } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    if (users?.users) {
      usersSummary = await Promise.all(
        users.users.map(async (u) => {
          const r = await admin
            .from('transactions')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', u.id);
          return { email: u.email, id: u.id, txCount: r.count ?? 0 };
        })
      );
    }
  } catch (err) {
    errorMsg = err instanceof Error ? err.message : String(err);
  }

  return NextResponse.json({
    env,
    resolvedUserId,
    txCountForUser,
    totalTxCount,
    usersSummary,
    error: errorMsg,
  });
}
