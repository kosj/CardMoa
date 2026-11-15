-- ============================================================
-- 009: 추억 사진 연결 — 쪽지에 사진 한 장, 미쿠 카드 사진
-- Supabase SQL Editor에서 실행 (006·007 실행 이후)
-- ============================================================
-- 사진이 지워지면 연결만 끊긴다(ON DELETE SET NULL) — 쪽지·설정은 그대로 남는다.
-- ============================================================

-- 쪽지에 붙인 사진 (선택)
ALTER TABLE public.letters
  ADD COLUMN IF NOT EXISTS memory_id UUID
    REFERENCES public.memories(id) ON DELETE SET NULL;

-- 미쿠를 누르면 뒤집혀 보이는 사진 (선택, 가족이 직접 고른 경우에만)
ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS miku_memory_id UUID
    REFERENCES public.memories(id) ON DELETE SET NULL;
