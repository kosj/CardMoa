-- ============================================================
-- 002: currency 컬럼 추가 + 중복 방지 유니크 제약
-- Supabase SQL Editor에서 실행
-- ============================================================

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'KRW';

-- ADD CONSTRAINT는 IF NOT EXISTS를 지원하지 않으므로 DO 블록으로 처리
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'transactions_dedup_key'
      AND conrelid = 'public.transactions'::regclass
  ) THEN
    ALTER TABLE public.transactions
      ADD CONSTRAINT transactions_dedup_key
      UNIQUE (user_id, card_company, approved_at, merchant, amount);
  END IF;
END $$;
