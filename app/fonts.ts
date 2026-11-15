import { Nanum_Pen_Script } from 'next/font/google';

/**
 * 손글씨 폰트 (나눔 펜) — 아빠의 쪽지, 사진 아래 캡션처럼 '손으로 쓴' 글에만 쓴다.
 * 한글 글리프는 unicode-range로 잘게 나뉘어 있어 미리 불러오지 않는다(preload: false).
 * 여러 화면이 같은 인스턴스를 쓰도록 여기 한 곳에서 만든다.
 */
export const handwriting = Nanum_Pen_Script({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  preload: false,
  adjustFontFallback: false,
  fallback: ['cursive'],
});
