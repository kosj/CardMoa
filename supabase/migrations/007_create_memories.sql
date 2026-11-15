-- ============================================================
-- 007: 추억 사진 — '우리 이야기' 비공개 가족 앨범
-- Supabase SQL Editor에서 실행
-- ============================================================
-- 사진 파일은 비공개 Storage 버킷 'memories'에, 찍은 시각·캡션·장(章) 이름은
-- memories 테이블에 저장한다.
--
-- - 서버(서비스 롤)만 읽고 쓴다. 버킷에는 공개 정책을 만들지 않으며,
--   브라우저는 1시간짜리 서명 URL로만 사진을 본다.
-- - 사진은 올리기 전에 브라우저에서 WebP로 다시 그려 위치(GPS)·기기 정보 같은
--   메타데이터를 모두 지운 뒤 저장한다. 그래서 버킷은 image/webp만 받는다.
-- - 파일 경로: {user_id}/{uuid}.webp (큰 사진), {user_id}/{uuid}_thumb.webp (썸네일)
--
-- 이 마이그레이션을 실행하기 전에도 화면은 정상 동작한다.
-- 사진 목록은 빈 상태로 보이고, 사진 올리기만 안내 메시지와 함께 실패한다.
-- 여러 번 실행해도 안전하다. (IF NOT EXISTS / ON CONFLICT DO NOTHING)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.memories (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  taken_at     TIMESTAMPTZ NOT NULL,
  caption      TEXT        NOT NULL DEFAULT '' CHECK (char_length(caption) <= 200),
  chapter      TEXT        NOT NULL DEFAULT '' CHECK (char_length(chapter) <= 40),
  storage_path TEXT        NOT NULL,
  thumb_path   TEXT        NOT NULL,
  width        INT         NOT NULL CHECK (width > 0),
  height       INT         NOT NULL CHECK (height > 0),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 타임라인은 찍은 순서(오래된 것부터)로 보여주므로 (user_id, taken_at) 순서로 색인
CREATE INDEX IF NOT EXISTS memories_user_id_taken_at_idx
  ON public.memories (user_id, taken_at);

ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;

-- 본인 사진 정보만 조회 가능 (서비스 롤은 RLS를 우회하므로 별도 정책 불필요)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'memories'
      AND policyname = 'memories_select_own'
  ) THEN
    CREATE POLICY "memories_select_own"
      ON public.memories
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- ============================================================
-- 비공개 Storage 버킷 — 파일 하나당 최대 5MB, WebP만 허용
-- storage.objects에 공개(anon/authenticated) 정책을 추가하지 않는다.
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('memories', 'memories', false, 5242880, ARRAY['image/webp'])
ON CONFLICT (id) DO NOTHING;
