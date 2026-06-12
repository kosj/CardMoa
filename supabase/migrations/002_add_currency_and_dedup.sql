-- ============================================================
-- 002: currency 컬럼 추가 + 중복 방지 유니크 제약
-- Supabase SQL Editor에서 실행
-- ============================================================

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'KRW';

-- 동일 유저의 같은 결제 내역 중복 저장 방지
-- upsert(onConflict) 시 이 제약을 사용해 ignoreDuplicates 처리
ALTER TABLE public.transactions
  ADD CONSTRAINT IF NOT EXISTS transactions_dedup_key
  UNIQUE (user_id, card_company, approved_at, merchant, amount);
