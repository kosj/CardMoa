import type { Metadata } from 'next';
import { getAppUserId } from '@/lib/app-user';
import { listMemoriesWithUrls } from '@/lib/memories';
import { MemoryTimeline } from '../components/MemoryTimeline';
import { MemoryManager } from '../components/MemoryManager';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '우리 이야기 · 은별이 대학생활 노트',
};

export default async function MemoriesPage() {
  const userId = await getAppUserId();
  const memories = userId ? await listMemoriesWithUrls(userId) : [];

  return (
    <main className="mx-auto max-w-4xl px-4 sm:px-6 py-8 space-y-6">
      <MemoryTimeline memories={memories} />

      {/* 아빠가 쓰는 정리 도구 — 담백하게 아래쪽에 */}
      <MemoryManager memories={memories} />
    </main>
  );
}
