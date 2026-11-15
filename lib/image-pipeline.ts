/**
 * 추억 사진 올리기 전처리 — 브라우저 전용, 외부 의존성 없음.
 *
 * 1) readExifDate: JPEG의 EXIF에서 찍은 시각을 읽는다. (손으로 쓴 작은 파서)
 * 2) resizeToWebp: EXIF 회전을 적용해 똑바로 세운 뒤, 긴 변을 줄여 WebP로 다시 그린다.
 *
 * 개인정보: 캔버스로 다시 그려 인코딩하면 원본의 메타데이터(GPS 위치, 기기 정보,
 * 촬영 설정 등)가 전부 사라진다. 서버·저장소에는 픽셀만 남은 WebP만 올라간다.
 * 이 모듈은 서버에서 쓰는 상수 외에 모듈 최상단에서 브라우저 API를 건드리지 않는다.
 */

/** 큰 사진(긴 변 1600px) WebP의 최대 크기 — 서버 액션 검증과 같은 값 */
export const MEMORY_FULL_MAX_BYTES = 3 * 1024 * 1024;
/** 썸네일(긴 변 480px) WebP의 최대 크기 — 서버 액션 검증과 같은 값 */
export const MEMORY_THUMB_MAX_BYTES = 512 * 1024;

/** WebP 품질. 크기 제한을 넘으면 차례로 낮춰 다시 시도한다 */
const WEBP_QUALITIES = [0.82, 0.72, 0.6, 0.5];

/* ────────────────────────────────────────────
   EXIF 촬영 시각
   ──────────────────────────────────────────── */

/** EXIF가 들어 있는 앞부분만 읽는다. (APP 세그먼트는 각각 64KB 이하) */
const HEAD_BYTES = 256 * 1024;
/** 메타데이터 세그먼트를 찾느라 읽을 최대 범위 */
const MAX_SCAN_BYTES = 2 * 1024 * 1024;

const TAG_DATETIME = 0x0132; // IFD0 DateTime (파일 수정 시각에 가까움 — 대체용)
const TAG_EXIF_IFD = 0x8769; // IFD0 → Exif IFD 포인터
const TAG_DATETIME_ORIGINAL = 0x9003; // Exif IFD DateTimeOriginal (셔터를 누른 시각)
const TYPE_ASCII = 2;

/**
 * JPEG의 EXIF에서 찍은 시각을 읽는다.
 * DateTimeOriginal(0x9003)을 우선하고, 없으면 DateTime(0x0132)을 쓴다.
 *
 * EXIF 시각에는 시간대가 없다. 이 가족의 휴대폰은 현지 시각(한국·일본, 둘 다 +09:00)으로
 * 기록하므로 한국 시간(KST) 벽시계 시각으로 해석한다. OffsetTime 태그는 일부러 보지 않는다
 * — 휴대폰 사진첩에 보이는 날짜와 화면의 날짜가 어긋나지 않게 하기 위해서다.
 *
 * JPEG가 아니거나 정보가 없으면 null. (호출하는 쪽에서 file.lastModified로 대체)
 */
export async function readExifDate(file: Blob): Promise<Date | null> {
  try {
    const tiff = await findExifTiff(file);
    if (!tiff) return null;
    return readTiffDate(tiff);
  } catch {
    return null;
  }
}

/** APP1 'Exif\0\0' 세그먼트를 찾아 그 안의 TIFF 블록을 돌려준다 */
async function findExifTiff(file: Blob): Promise<DataView | null> {
  const limit = Math.min(file.size, MAX_SCAN_BYTES);
  let view = await readHead(file, Math.min(limit, HEAD_BYTES));

  /** view가 [0, end)를 담도록 필요하면 더 읽는다 */
  const ensure = async (end: number): Promise<boolean> => {
    if (end <= view.byteLength) return true;
    if (end > limit) return false;
    view = await readHead(file, Math.min(limit, Math.max(end, view.byteLength * 2)));
    return end <= view.byteLength;
  };

  // SOI (FF D8) 로 시작해야 JPEG
  if (view.byteLength < 4 || view.getUint16(0) !== 0xffd8) return null;

  let off = 2;
  while (await ensure(off + 4)) {
    if (view.getUint8(off) !== 0xff) return null; // 구조가 깨졌다
    const marker = view.getUint8(off + 1);
    if (marker === 0xff) {
      off += 1; // 채움 바이트
      continue;
    }
    // SOS(이미지 데이터 시작)·EOI 이후에는 메타데이터가 없다
    if (marker === 0xda || marker === 0xd9) return null;
    // 길이가 없는 독립 마커
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      off += 2;
      continue;
    }

    const length = view.getUint16(off + 2); // 길이 2바이트 자신을 포함
    if (length < 2) return null;
    const start = off + 4;
    const end = off + 2 + length;

    if (marker === 0xe1 && length >= 2 + 6 + 8) {
      if (!(await ensure(end))) return null;
      // 'Exif\0\0'
      if (
        view.getUint32(start) === 0x45786966 &&
        view.getUint16(start + 4) === 0x0000
      ) {
        return new DataView(view.buffer, view.byteOffset + start + 6, end - start - 6);
      }
    }
    off = end;
  }
  return null;
}

async function readHead(file: Blob, bytes: number): Promise<DataView> {
  return new DataView(await file.slice(0, bytes).arrayBuffer());
}

/** TIFF 헤더(II/MM) → IFD0 → Exif IFD → DateTimeOriginal, 없으면 DateTime */
function readTiffDate(tiff: DataView): Date | null {
  if (tiff.byteLength < 8) return null;
  const order = tiff.getUint16(0);
  const little = order === 0x4949 ? true : order === 0x4d4d ? false : null;
  if (little === null) return null;
  if (tiff.getUint16(2, little) !== 42) return null;

  const ifd0 = readIfd(tiff, tiff.getUint32(4, little), little);
  if (!ifd0) return null;

  const exifPtr = ifd0.get(TAG_EXIF_IFD);
  if (exifPtr !== undefined) {
    const exifIfd = readIfd(tiff, readLongValue(tiff, exifPtr, little), little);
    const original = exifIfd?.get(TAG_DATETIME_ORIGINAL);
    const date = original !== undefined ? parseExifDateTime(readAscii(tiff, original, little)) : null;
    if (date) return date;
  }

  const fallback = ifd0.get(TAG_DATETIME);
  return fallback !== undefined ? parseExifDateTime(readAscii(tiff, fallback, little)) : null;
}

/** IFD를 읽어 태그 → 항목 시작 위치(TIFF 기준) 맵을 만든다 */
function readIfd(tiff: DataView, offset: number, little: boolean): Map<number, number> | null {
  if (offset < 8 || offset + 2 > tiff.byteLength) return null;
  const count = tiff.getUint16(offset, little);
  const entries = new Map<number, number>();
  for (let i = 0; i < count; i++) {
    const entry = offset + 2 + i * 12;
    if (entry + 12 > tiff.byteLength) break;
    entries.set(tiff.getUint16(entry, little), entry);
  }
  return entries;
}

function readLongValue(tiff: DataView, entry: number, little: boolean): number {
  return tiff.getUint32(entry + 8, little);
}

/** ASCII 항목 값을 읽는다. 4바이트 이하면 항목 안에, 넘으면 오프셋 위치에 있다 */
function readAscii(tiff: DataView, entry: number, little: boolean): string | null {
  if (tiff.getUint16(entry + 2, little) !== TYPE_ASCII) return null;
  const count = tiff.getUint32(entry + 4, little);
  if (count === 0 || count > 64) return null;
  const at = count <= 4 ? entry + 8 : tiff.getUint32(entry + 8, little);
  if (at + count > tiff.byteLength) return null;
  let s = '';
  for (let i = 0; i < count; i++) {
    const c = tiff.getUint8(at + i);
    if (c === 0) break;
    s += String.fromCharCode(c);
  }
  return s;
}

const EXIF_DATE_RE = /^(\d{4})[:\-/](\d{2})[:\-/](\d{2})[ T](\d{2}):(\d{2}):(\d{2})/;
const KST_OFFSET_HOURS = 9;

/** 'YYYY:MM:DD HH:MM:SS'를 KST 벽시계 시각으로 해석한다. 빈 값('0000:00:00 …')은 null */
function parseExifDateTime(value: string | null): Date | null {
  if (!value) return null;
  const m = EXIF_DATE_RE.exec(value.trim());
  if (!m) return null;
  const [y, mo, d, h, mi, s] = m.slice(1).map(Number);
  if (y < 1900 || mo < 1 || mo > 12 || d < 1 || d > 31 || h > 23 || mi > 59 || s > 60) {
    return null;
  }
  // 2월 31일처럼 없는 날짜는 거른다
  if (new Date(Date.UTC(y, mo - 1, d)).getUTCDate() !== d) return null;
  return new Date(Date.UTC(y, mo - 1, d, h - KST_OFFSET_HOURS, mi, s));
}

/* ────────────────────────────────────────────
   줄이기 · WebP 변환
   ──────────────────────────────────────────── */

export interface ResizedImage {
  blob: Blob;
  width: number;
  height: number;
}

export type ImagePipelineErrorCode = 'decode' | 'canvas' | 'webp-unsupported' | 'too-large';

export class ImagePipelineError extends Error {
  readonly code: ImagePipelineErrorCode;

  constructor(code: ImagePipelineErrorCode) {
    super(`image-pipeline: ${code}`);
    this.name = 'ImagePipelineError';
    this.code = code;
  }
}

/**
 * 사진을 디코딩한다. imageOrientation: 'from-image'로 EXIF 회전 태그를 적용해
 * 옆으로 누운 채 저장된 사진도 똑바로 세운다.
 * 큰 사진·썸네일을 만들 때 한 번만 디코딩하도록 따로 열어 둔다. (다 쓰면 close())
 */
export async function decodeImage(file: Blob): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    // HEIC 등 이 브라우저가 열 수 없는 형식
    throw new ImagePipelineError('decode');
  }
}

/**
 * 긴 변이 maxEdge를 넘지 않게 줄여 WebP로 다시 그린다. (작은 사진은 키우지 않는다)
 * maxBytes를 주면 그 크기 안에 들어올 때까지 품질을 낮춰 다시 인코딩한다.
 *
 * 개인정보: 캔버스에서 새로 인코딩하므로 EXIF·XMP 등 원본 메타데이터(GPS, 기기)가
 * 하나도 따라가지 않는다. 회전은 이미 픽셀에 반영되어 있어 회전 태그도 필요 없다.
 */
export async function resizeToWebp(
  source: Blob | ImageBitmap,
  maxEdge: number,
  maxBytes?: number
): Promise<ResizedImage> {
  const ownsBitmap = source instanceof Blob;
  const bitmap = ownsBitmap ? await decodeImage(source) : source;
  const canvas = document.createElement('canvas');
  try {
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new ImagePipelineError('canvas');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bitmap, 0, 0, width, height);

    for (const quality of WEBP_QUALITIES) {
      const blob = await canvasToBlob(canvas, quality);
      // WebP 인코딩을 못 하는 브라우저는 조용히 PNG를 돌려준다
      if (blob.type !== 'image/webp') throw new ImagePipelineError('webp-unsupported');
      if (!maxBytes || blob.size <= maxBytes) return { blob, width, height };
    }
    throw new ImagePipelineError('too-large');
  } finally {
    if (ownsBitmap) bitmap.close();
    // 모바일 사파리의 캔버스 메모리 한도를 넘지 않게 바로 비운다
    canvas.width = 0;
    canvas.height = 0;
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new ImagePipelineError('canvas'))),
      'image/webp',
      quality
    );
  });
}

/** 전처리 오류를 아빠가 읽을 안내 문구로 바꾼다 */
export function describeImageError(err: unknown): string {
  const code = err instanceof ImagePipelineError ? err.code : null;
  switch (code) {
    case 'decode':
      return '이 브라우저에서 열 수 없는 사진이에요. (HEIC라면 JPEG로 바꿔서 올려주세요)';
    case 'webp-unsupported':
      return '이 브라우저는 사진 변환(WebP)을 지원하지 않아요. 크롬이나 엣지에서 올려주세요.';
    case 'too-large':
      return '사진을 충분히 작게 줄이지 못했어요.';
    default:
      return '사진을 준비하지 못했어요. 다른 사진으로 시도해주세요.';
  }
}
