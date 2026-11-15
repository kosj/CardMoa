-- ============================================================
-- 006: 아빠의 쪽지 테이블 — 대시보드 '아빠가 보낸 쪽지 💌'
-- Supabase SQL Editor에서 실행
-- ============================================================
-- 아빠가 은별이에게 남기는 짧은 쪽지(1~500자)를 저장한다.
-- 서버(서비스 롤)에서만 읽고 쓰며, opened_at에는 쪽지를
-- 처음 열어 본 시각을 기록한다. (아직 안 열었으면 NULL)
--
-- 이 마이그레이션을 실행하기 전에도 대시보드는 정상 동작한다.
-- 쪽지 목록은 빈 상태로 보이고, 쪽지 보내기만 안내 메시지와 함께 실패한다.
-- 여러 번 실행해도 안전하다. (IF NOT EXISTS)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.letters (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body       TEXT        NOT NULL CHECK (char_length(body) BETWEEN 1 AND 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  opened_at  TIMESTAMPTZ NULL
);

-- 최신 쪽지부터 보여주므로 (user_id, created_at DESC) 순서로 색인
CREATE INDEX IF NOT EXISTS letters_user_id_created_at_idx
  ON public.letters (user_id, created_at DESC);

ALTER TABLE public.letters ENABLE ROW LEVEL SECURITY;

-- 본인 쪽지만 조회 가능 (서비스 롤은 RLS를 우회하므로 별도 정책 불필요)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'letters'
      AND policyname = 'letters_select_own'
  ) THEN
    CREATE POLICY "letters_select_own"
      ON public.letters
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;
