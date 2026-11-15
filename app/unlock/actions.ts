'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  FAMILY_COOKIE,
  FAMILY_COOKIE_MAX_AGE,
  familyToken,
  getFamilyPasscode,
  passcodeMatches,
  safeNextPath,
} from '@/lib/family-gate';

export interface UnlockState {
  error: string | null;
  /** 시도할 때마다 1씩 늘어난다 — 같은 오류가 반복돼도 화면이 다시 반응하도록 */
  attempt: number;
}

/** 틀렸을 때 잠깐 쉬어 간다 — 무작정 여러 번 넣어 보는 것을 느리게 */
const WRONG_PASSCODE_DELAY_MS = 700;

const cookieBase = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

/** 가족 암호 확인 → 맞으면 쿠키를 굽고 원래 보려던 노트 화면으로 */
export async function unlockAction(prev: UnlockState, formData: FormData): Promise<UnlockState> {
  const attempt = (prev?.attempt ?? 0) + 1;
  const passcode = getFamilyPasscode();

  if (!passcode) {
    return { error: '아직 가족 암호가 설정되지 않았어요', attempt };
  }

  const input = formData.get('passcode');
  if (typeof input !== 'string' || input.trim().length === 0) {
    return { error: '가족 암호를 입력해 주세요', attempt };
  }

  if (!(await passcodeMatches(input))) {
    await new Promise((resolve) => setTimeout(resolve, WRONG_PASSCODE_DELAY_MS));
    return { error: '암호가 맞지 않아요', attempt };
  }

  cookies().set(FAMILY_COOKIE, await familyToken(passcode), {
    ...cookieBase,
    maxAge: FAMILY_COOKIE_MAX_AGE,
  });
  redirect(safeNextPath(formData.get('next')));
}

/** 이 기기에서 노트 잠그기 → 처음 화면으로 */
export async function lockAction(): Promise<void> {
  cookies().set(FAMILY_COOKIE, '', { ...cookieBase, maxAge: 0, expires: new Date(0) });
  // 브라우저에 남아 있는 노트 화면(라우터 캐시)도 비운다
  revalidatePath('/', 'layout');
  redirect('/');
}
