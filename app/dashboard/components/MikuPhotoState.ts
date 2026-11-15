'use client';

import { useOptimistic, useState, useTransition } from 'react';
import type { Memory } from '@/lib/memory-types';
import { updateMikuMemory } from '../miku-actions';

const THROWN_ERROR = '미쿠 카드 사진을 저장하지 못했어요. 잠시 후 다시 시도해주세요.';

/**
 * 미쿠 카드 뒷면 사진 — 고르면 바로 바뀌고(낙관적 UI), 저장에 실패하면 원래대로 돌아간다.
 * 고른 사진이 지워졌으면(id는 있는데 목록에 없으면) '사진 없음'과 똑같이 다룬다.
 */
export function useMikuPhoto(memories: Memory[], savedFromServer: string | null) {
  // 서버 값이 바뀌면(저장 후 revalidate) 그 값을 따른다
  const [serverId, setServerId] = useState(savedFromServer);
  const [savedId, setSavedId] = useState(savedFromServer);
  if (serverId !== savedFromServer) {
    setServerId(savedFromServer);
    setSavedId(savedFromServer);
  }

  const [shownId, setShownId] = useOptimistic(savedId);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const photo = shownId ? (memories.find((m) => m.id === shownId) ?? null) : null;

  function choose(id: string | null) {
    setError(null);
    if (id === (photo?.id ?? null)) return;

    startTransition(async () => {
      setShownId(id);
      try {
        const res = await updateMikuMemory(id);
        if (res.success) {
          setSavedId(id);
        } else {
          setError(res.error ?? THROWN_ERROR);
        }
      } catch (err) {
        console.error('[miku] 사진 저장 예외:', err);
        setError(THROWN_ERROR);
      }
      // 실패하면 전환이 끝나는 순간 shownId가 savedId(이전 값)로 되돌아간다
    });
  }

  return { photo, choose, pending, error, clearError: () => setError(null) };
}
