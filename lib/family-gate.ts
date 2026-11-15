/**
 * 가족 암호 잠금 — 노트(/dashboard)는 가족 암호를 아는 사람만 열 수 있다.
 *
 * - 암호는 서버 전용 환경변수 FAMILY_PASSCODE 에만 둔다 (NEXT_PUBLIC 금지).
 * - 쿠키 값은 암호 자체가 아니라 HMAC-SHA256(key = 암호, msg = 고정 라벨) 이다.
 *   암호를 바꾸면 예전 쿠키는 모두 자동으로 무효가 된다.
 * - Web Crypto(crypto.subtle)만 쓰므로 Edge 미들웨어와 Node 서버 액션 양쪽에서 동작한다.
 * - 암호가 설정되지 않았으면 언제나 '잠김' (fail closed).
 */

export const FAMILY_COOKIE = 'cardmoa_family';

/** 한 번 열면 180일 동안 기억한다 */
export const FAMILY_COOKIE_MAX_AGE = 60 * 60 * 24 * 180;

/** 잠금 해제 후 돌아갈 기본 위치 */
export const FAMILY_HOME = '/dashboard';

/** 쿠키 형식을 바꿔야 할 때 v2로 올리면 기존 쿠키가 모두 무효가 된다 */
const TOKEN_LABEL = 'cardmoa-family-v1';

const encoder = new TextEncoder();

/** 휴대폰 키보드가 붙이는 앞뒤 공백·한글 조합 차이(NFC/NFD)에 흔들리지 않게 */
function normalizePasscode(value: string): string {
  return value.normalize('NFC').trim();
}

/** 설정된 가족 암호. 없거나 비어 있으면 null (= 잠금 해제 불가) */
export function getFamilyPasscode(): string | null {
  const raw = process.env.FAMILY_PASSCODE;
  if (typeof raw !== 'string') return null;
  const value = normalizePasscode(raw);
  return value.length > 0 ? value : null;
}

export function isFamilyGateConfigured(): boolean {
  return getFamilyPasscode() !== null;
}

function toBase64Url(bytes: ArrayBuffer): string {
  let binary = '';
  const view = new Uint8Array(bytes);
  for (let i = 0; i < view.length; i++) binary += String.fromCharCode(view[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** 암호로 만든 쿠키 토큰: base64url(HMAC-SHA256(key = 암호, msg = 라벨)) */
export async function familyToken(passcode: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(normalizePasscode(passcode)),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(TOKEN_LABEL));
  return toBase64Url(signature);
}

/** 길이가 달라도 같은 시간이 걸리도록 끝까지 비교한다 */
function constantTimeEqual(a: string, b: string): boolean {
  const len = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < len; i++) {
    // 범위를 벗어난 charCodeAt은 NaN → (NaN | 0) === 0
    diff |= (a.charCodeAt(i) | 0) ^ (b.charCodeAt(i) | 0);
  }
  return diff === 0;
}

// 요청마다 HMAC을 다시 계산하지 않도록, 현재 암호로 만든 토큰을 기억해 둔다
let cachedToken: { passcode: string; token: Promise<string> } | null = null;

function expectedToken(passcode: string): Promise<string> {
  if (!cachedToken || cachedToken.passcode !== passcode) {
    cachedToken = { passcode, token: familyToken(passcode) };
  }
  return cachedToken.token;
}

/** 쿠키 값이 '지금' 설정된 암호로 만든 토큰과 같은지 (상수 시간 비교) */
export async function isValidFamilyCookie(value: string | null | undefined): Promise<boolean> {
  const passcode = getFamilyPasscode();
  if (!passcode || typeof value !== 'string' || value.length === 0 || value.length > 256) {
    return false;
  }
  const expected = await expectedToken(passcode);
  return constantTimeEqual(value, expected);
}

/**
 * 입력한 암호가 맞는지. 문자열을 직접 비교하지 않고 양쪽을 같은 길이의 HMAC으로 바꿔
 * 상수 시간에 비교한다 (암호 길이도 새지 않는다).
 */
export async function passcodeMatches(input: string): Promise<boolean> {
  const passcode = getFamilyPasscode();
  if (!passcode || typeof input !== 'string') return false;
  const normalized = normalizePasscode(input);
  if (normalized.length === 0 || normalized.length > 256) return false;
  const [given, expected] = await Promise.all([familyToken(normalized), expectedToken(passcode)]);
  return constantTimeEqual(given, expected);
}

/**
 * 잠금 해제 후 돌아갈 경로. 노트 안쪽(/dashboard…)만 허용하고 나머지는 모두 /dashboard.
 * (외부 주소·프로토콜 상대 주소·역슬래시·제어 문자·상위 경로 이동을 막는다)
 */
export function safeNextPath(raw: unknown): string {
  if (typeof raw !== 'string' || raw.length === 0 || raw.length > 512) return FAMILY_HOME;
  if (/[\u0000-\u001f\u007f\\]/.test(raw) || raw.includes('/..')) return FAMILY_HOME;
  if (raw === FAMILY_HOME || /^\/dashboard[/?#]/.test(raw)) return raw;
  return FAMILY_HOME;
}

/**
 * 서버 액션·라우트 핸들러용: 지금 요청이 가족 쿠키를 갖고 있는지.
 * 미들웨어가 1차로 막지만, 사진 업로드처럼 민감한 서버 액션은 이것으로 한 번 더 확인한다.
 *   if (!(await hasFamilyAccess())) throw new Error('잠겨 있어요');
 * (next/headers는 요청 안에서만 쓸 수 있어 동적으로 불러온다 — 미들웨어에서는 호출하지 않는다)
 */
export async function hasFamilyAccess(): Promise<boolean> {
  const { cookies } = await import('next/headers');
  return isValidFamilyCookie(cookies().get(FAMILY_COOKIE)?.value);
}
