-- ============================================================
-- 003: 수업료(TUITION) 카테고리 추가
-- card_company CHECK 제약에 'TUITION' 허용
-- Supabase SQL Editor에서 실행
-- ============================================================

ALTER TABLE public.transactions
  DROP CONSTRAINT IF EXISTS transactions_card_company_check;

ALTER TABLE public.transactions
  ADD CONSTRAINT transactions_card_company_check
  CHECK (card_company IN ('SHINHAN', 'LOTTE', 'TUITION', 'UNKNOWN'));
