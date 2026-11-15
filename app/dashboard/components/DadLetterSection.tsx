import { getAppUserId } from '@/lib/app-user';
import { listLetters } from '@/lib/letters';
import { DadLetter } from './DadLetter';

/** 아빠가 보낸 쪽지 — 서버에서 최근 쪽지를 읽어 클라이언트 카드에 넘긴다. */
export async function DadLetterSection() {
  const userId = await getAppUserId();
  const letters = userId ? await listLetters(userId) : [];
  return <DadLetter initialLetters={letters} />;
}
