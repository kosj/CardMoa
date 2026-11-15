import type { Memory } from '@/lib/memory-types';

/**
 * [임시 스텁] 백엔드 워커가 실제 구현(Supabase Storage 서명 URL 포함)으로 교체한다.
 * 촬영 시각 오름차순으로 반환한다.
 */
export async function listMemoriesWithUrls(userId: string): Promise<Memory[]> {
  void userId;
  return [];
}
