'use client';

import type { Memory } from '@/lib/memory-types';

/**
 * [임시 스텁] 백엔드 워커가 실제 '추억 정리하기'(업로드·캡션 수정·삭제) UI로 교체한다.
 * 타임라인 페이지 하단에 놓인다.
 */
export function MemoryManager({ memories }: { memories: Memory[] }) {
  void memories;
  return null;
}
