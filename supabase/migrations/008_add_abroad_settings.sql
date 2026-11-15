-- ============================================================
-- 008: '바다 건너 D-day' 설정 — 머무는 도시·떠난 날·다음 만남
-- Supabase SQL Editor에서 실행 (005 실행 이후)
-- ============================================================
-- 저장소가 공개(public)이므로 도시 이름·날짜는 코드가 아니라
-- 이 설정 테이블에만 저장한다. 대시보드에서 직접 입력·수정한다.
-- ============================================================

ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS abroad_city TEXT
    CHECK (abroad_city IS NULL OR char_length(abroad_city) BETWEEN 1 AND 20),
  ADD COLUMN IF NOT EXISTS abroad_since DATE,
  ADD COLUMN IF NOT EXISTS next_visit DATE;
