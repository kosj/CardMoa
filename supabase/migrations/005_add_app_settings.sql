-- ============================================================
-- 005: 앱 설정 테이블 — '국내(원화) 결제 포함' 토글
-- Supabase SQL Editor에서 실행
-- ============================================================
-- 기존에는 이 설정이 브라우저 localStorage에만 있어서
-- 웹훅(MacroDroid 등 자동 유입)이 설정을 알 수 없었고,
-- 체크가 꺼져 있어도 국내 결제가 계속 저장되었다.
-- 설정을 서버에 두어 붙여넣기 UI·웹훅이 같은 값을 따르게 한다.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.app_settings (
  user_id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  include_domestic BOOLEAN     NOT NULL DEFAULT true,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- 본인 설정만 조회 가능 (서비스 롤은 RLS를 우회하므로 별도 정책 불필요)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'app_settings'
      AND policyname = 'app_settings_select_own'
  ) THEN
    CREATE POLICY "app_settings_select_own"
      ON public.app_settings
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- ============================================================
-- (선택) 국내 결제를 제외한 상태로 시작하고 싶다면 함께 실행.
-- 실행하지 않으면 기본값 true(포함)이며, 대시보드 체크박스로 언제든 바꿀 수 있다.
-- ============================================================
-- INSERT INTO public.app_settings (user_id, include_domestic)
-- SELECT id, false FROM auth.users WHERE lower(email) = 'godkosj@gmail.com'
-- ON CONFLICT (user_id) DO UPDATE SET include_domestic = false, updated_at = now();
