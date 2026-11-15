/**
 * 추억 정리하기 — 날짜 표시·입력 도우미.
 * 사진 날짜는 모두 한국 시간(KST) 벽시계 기준으로 보여주고 입력받는다.
 * (memoryDateKey·defaultChapter와 같은 기준이라 '같은 날'이 어긋나지 않는다)
 */

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** ISO → <input type="datetime-local"> 값 'YYYY-MM-DDTHH:mm' (KST) */
export function toKstInput(iso: string): string {
  return new Date(Date.parse(iso) + KST_OFFSET_MS).toISOString().slice(0, 16);
}

/** 'YYYY-MM-DDTHH:mm[:ss]' (KST) → ISO. 비었거나 잘못되면 null */
export function fromKstInput(value: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value);
  if (!m) return null;
  const ms = Date.parse(`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6] ?? '00'}+09:00`);
  return Number.isFinite(ms) ? new Date(ms).toISOString() : null;
}

/** 입력값의 KST 날짜 'YYYY-MM-DD' — 같은 날 찍은 사진끼리 묶는 키 */
export function kstDayOfInput(value: string): string {
  return value.slice(0, 10);
}

const shortFmt = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
});

const longFmt = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  weekday: 'short',
  hour: 'numeric',
  minute: '2-digit',
});

/** '2025. 4. 25.' */
export function formatKstShort(iso: string): string {
  return shortFmt.format(new Date(iso));
}

/** '2025년 4월 25일 (금) 오후 4:48' */
export function formatKstLong(iso: string): string {
  return longFmt.format(new Date(iso));
}
