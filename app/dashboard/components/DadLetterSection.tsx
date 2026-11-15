import { getAppUserId } from '@/lib/app-user';
import { listLetters } from '@/lib/letters';
import { listMemoriesWithUrls } from '@/lib/memories';
import type { Memory } from '@/lib/memory-types';
import { DadLetter } from './DadLetter';

interface Props {
  /** 페이지가 이미 읽어 둔 추억 사진 — 없으면 여기서 직접 읽는다 */
  memories?: Memory[];
}

async function loadMemories(userId: string | null): Promise<Memory[]> {
  if (!userId) return [];
  try {
    return await listMemoriesWithUrls(userId);
  } catch (err) {
    console.error('[letters] 사진 목록 예외:', err);
    return [];
  }
}

/**
 * 아빠가 보낸 쪽지 — 서버에서 최근 쪽지와 (쪽지에 붙일·붙인) 추억 사진을 읽어
 * 클라이언트 카드에 넘긴다.
 */
export async function DadLetterSection({ memories }: Props = {}) {
  const userId = await getAppUserId();
  const [letters, photos] = await Promise.all([
    userId ? listLetters(userId) : Promise.resolve([]),
    memories ? Promise.resolve(memories) : loadMemories(userId),
  ]);
  return <DadLetter initialLetters={letters} memories={photos} />;
}
