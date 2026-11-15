import { seoulDateParts } from '@/lib/utils';

/**
 * 추억 사진 공통 계약 — 업로드(백엔드)·타임라인·생활 기록 연결이 함께 쓴다.
 *
 * 개인정보 원칙: 저장소가 공개(public)이므로 학교 이름, 출국일 같은
 * 식별 가능한 정보는 코드에 쓰지 않는다. 장(章) 이름·캡션은 DB에만 저장.
 */

/** 화면으로 내려가는 추억 사진 한 장 (서명 URL 포함) */
export interface Memory {
  id: string;
  /** 촬영 시각 ISO 문자열 (사진 EXIF에서 추출, 없으면 파일 수정 시각) */
  taken_at: string;
  /** 사진 아래 손글씨 캡션 (최대 200자, 빈 문자열 가능) */
  caption: string;
  /** 타임라인 장(章) 이름 (최대 40자). 예: '졸업', '출발' */
  chapter: string;
  /** 큰 사진의 실제 픽셀 크기 — 레이아웃 흔들림(CLS) 방지용 */
  width: number;
  height: number;
  /** 큰 사진(긴 변 1600px WebP) 서명 URL — 1시간 유효 */
  url: string;
  /** 썸네일(긴 변 480px WebP) 서명 URL — 1시간 유효 */
  thumb_url: string;
}

/** 큰 사진·썸네일의 긴 변 길이(px) */
export const MEMORY_FULL_EDGE = 1600;
export const MEMORY_THUMB_EDGE = 480;

/** 캡션·장 이름 최대 길이 (DB CHECK 제약과 동일) */
export const MEMORY_CAPTION_MAX = 200;
export const MEMORY_CHAPTER_MAX = 40;

/** KST 기준 'YYYY-MM-DD' — 결제 내역과 '같은 날' 사진을 잇는 키 */
export function memoryDateKey(iso: string): string {
  const { year, month, day } = seoulDateParts(iso);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** 장 이름 기본값: 촬영 월 (예: '2026년 4월'). 업로드할 때 자유롭게 바꿀 수 있다 */
export function defaultChapter(iso: string): string {
  const { year, month } = seoulDateParts(iso);
  return `${year}년 ${month}월`;
}
