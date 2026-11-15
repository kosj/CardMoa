import { defaultChapter, memoryDateKey, type Memory } from '@/lib/memory-types';
import { seoulDateParts } from '@/lib/utils';

/**
 * '우리 이야기' 공용 도우미 — 장(章) 묶기, 날짜 표기, 사진마다 정해진 기울기.
 * 날짜는 모두 한국 시간(KST) 기준이라 서버·브라우저가 같은 글자를 그린다.
 */

export interface StoryChapter {
  name: string;
  memories: Memory[];
  /** 이 장에서 가장 이른·늦은 촬영 시각 */
  startIso: string;
  endIso: string;
}

/** 장 이름 — 비어 있으면 촬영 월 ('2026년 5월') */
export function storyChapterName(m: Memory): string {
  return m.chapter.trim() || defaultChapter(m.taken_at);
}

/** 촬영 시각 오름차순 (같으면 id로 고정) */
export function sortByTakenAt(memories: Memory[]): Memory[] {
  return [...memories].sort(
    (a, b) => Date.parse(a.taken_at) - Date.parse(b.taken_at) || a.id.localeCompare(b.id)
  );
}

/**
 * 장별로 묶는다. 장 순서 = 그 장의 가장 이른 사진 순, 장 안에서는 촬영 순.
 * (정렬된 목록을 차례로 넣으면 Map의 삽입 순서가 곧 '가장 이른 사진' 순이다)
 */
export function groupStoryChapters(memories: Memory[]): StoryChapter[] {
  const byName = new Map<string, Memory[]>();
  for (const m of sortByTakenAt(memories)) {
    const name = storyChapterName(m);
    const list = byName.get(name);
    if (list) list.push(m);
    else byName.set(name, [m]);
  }
  return Array.from(byName, ([name, list]) => ({
    name,
    memories: list,
    startIso: list[0].taken_at,
    endIso: list[list.length - 1].taken_at,
  }));
}

/** 같은 날(KST)끼리 묶은 지도 — 결제 내역의 날짜와 잇는다 */
export function groupMemoriesByDay(memories: Memory[]): Map<string, Memory[]> {
  const map = new Map<string, Memory[]>();
  for (const m of sortByTakenAt(memories)) {
    const key = memoryDateKey(m.taken_at);
    const list = map.get(key);
    if (list) list.push(m);
    else map.set(key, [m]);
  }
  return map;
}

/* ── 날짜 표기 ── */

/** 5월 9일 */
export function storyDayLabel(iso: string): string {
  const { month, day } = seoulDateParts(iso);
  return `${month}월 ${day}일`;
}

const longFmt = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  weekday: 'short',
});

/** 2026년 5월 9일 (토) */
export function storyLongDate(iso: string): string {
  const { year, month, day } = seoulDateParts(iso);
  return `${year}년 ${month}월 ${day}일 (${longFmt.format(new Date(iso))})`;
}

/** 2026.5.9 – 5.11 (같은 날이면 2026.5.9, 해를 넘기면 끝에도 연도) */
export function storyDateRange(startIso: string, endIso: string): string {
  const s = seoulDateParts(startIso);
  const e = seoulDateParts(endIso);
  const first = `${s.year}.${s.month}.${s.day}`;
  if (s.year === e.year && s.month === e.month && s.day === e.day) return first;
  if (s.year === e.year) return `${first} – ${e.month}.${e.day}`;
  return `${first} – ${e.year}.${e.month}.${e.day}`;
}

/* ── 사진마다 정해진 손맛 (id 해시라 새로고침해도 같은 자리·같은 기울기) ── */

/** FNV-1a 32비트 */
export function storyHash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** −3° ~ +3° 사이 기울기 (0.1° 단위) */
export function storyTilt(id: string): number {
  return Math.round((storyHash(id) % 61) - 30) / 10;
}
