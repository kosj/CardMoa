-- ============================================================
-- CardMoa — transactions 테이블 생성 및 RLS 설정
-- Supabase SQL Editor 또는 `supabase db push`로 실행
-- ============================================================

CREATE TABLE IF NOT EXISTS public.transactions (
  id           UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID           NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_company TEXT           NOT NULL CHECK (card_company IN ('SHINHAN', 'LOTTE', 'UNKNOWN')),
  approved_at  TIMESTAMPTZ    NOT NULL,
  merchant     TEXT           NOT NULL CHECK (char_length(merchant) > 0 AND char_length(merchant) <= 200),
  amount       NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
  created_at   TIMESTAMPTZ    NOT NULL DEFAULT now()
);

-- 자주 사용되는 (user_id, 최신순) 조회를 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_transactions_user_approved
  ON public.transactions (user_id, approved_at DESC);

-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- 본인 데이터만 조회 가능
CREATE POLICY "transactions_select_own"
  ON public.transactions
  FOR SELECT
  USING (auth.uid() = user_id);

-- 본인 user_id로만 삽입 가능 (서비스 롤은 RLS를 우회하므로 별도 정책 불필요)
CREATE POLICY "transactions_insert_own"
  ON public.transactions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 참고: 웹훅 API Route는 SUPABASE_SERVICE_ROLE_KEY를 사용하는
-- Admin Client로 INSERT한다. 서비스 롤은 RLS를 우회하지만
-- user_id → auth.users FK 제약이 존재하지 않는 UUID를 거부한다.
-- ============================================================
