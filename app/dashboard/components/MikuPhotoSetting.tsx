'use client';

import { useState } from 'react';
import { Camera } from 'lucide-react';
import type { Memory } from '@/lib/memory-types';
import { MemoryPicker } from './MemoryPicker';

interface Props {
  memories: Memory[];
  /** 지금 미쿠 카드 뒷면에 있는 사진 (없으면 null) */
  selectedId: string | null;
  onChoose: (id: string | null) => void;
  pending?: boolean;
}

/**
 * 미쿠 카드 뒷면 사진 고르기 — 아빠의 도구라 작고 조용하게.
 * 어떤 사진을 보여줄지(혹은 보여주지 않을지)는 가족이 직접 정한다.
 */
export function MikuPhotoSetting({ memories, selectedId, onChoose, pending = false }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="미쿠 카드 사진 고르기"
        title="미쿠 카드 사진 고르기"
        aria-busy={pending || undefined}
        className={`relative -my-1.5 -mr-1.5 rounded-full p-1.5 text-gray-300 transition-colors duration-quick hover:bg-cream-100 hover:text-gray-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-dusk-300 ${
          pending ? 'opacity-60' : ''
        }`}
      >
        <Camera className="h-3.5 w-3.5" />
        {selectedId && (
          // 사진을 골라 두었다는 작은 표시 (미쿠 색)
          <span
            aria-hidden="true"
            className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-[#46C3C0] ring-1 ring-white"
          />
        )}
      </button>

      <MemoryPicker
        open={open}
        memories={memories}
        selectedId={selectedId}
        onSelect={(id) => {
          setOpen(false);
          onChoose(id);
        }}
        onClose={() => setOpen(false)}
        title="미쿠 카드 뒷면 사진"
        description="미쿠를 누르면 뒤집혀서 보여요. 은별이가 괜찮다고 한 사진만 골라 주세요."
        allowNone
      />
    </>
  );
}
