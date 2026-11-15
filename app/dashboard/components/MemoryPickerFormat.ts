import { seoulDateParts } from '@/lib/utils';

/** '2026.4.3' — 사진 고르기 화면용 짧은 날짜 (KST) */
export function formatMemoryDate(iso: string): string {
  const { year, month, day } = seoulDateParts(iso);
  return `${year}.${month}.${day}`;
}
