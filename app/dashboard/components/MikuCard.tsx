'use client';

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type SVGProps,
} from 'react';
import { RotateCcw } from 'lucide-react';
import type { Memory } from '@/lib/memory-types';
import type { SpendingMood } from '@/lib/spending-review';
import { handwriting } from '@/app/fonts';
import { DancingMascot } from './DancingMascot';
import { formatMemoryDate } from './MemoryPickerFormat';
import { storyTilt } from './StoryFormat';
import './mascot-moods.css';

/** 뒷면 손글씨 — 어떤 사진이 와도 말이 되도록 사진을 설명하지 않는다 */
const BACK_LINE = '사실 진짜 미쿠는 여기 있지롱 💙';
const GIGGLE_LINE = '헤헤, 간지러워!';
/** 간지럼이 이어지는 시간 = 말풍선 지연 0.4s + miku-giggle-pop 1.5s (mascot-moods.css와 맞춘다) */
const GIGGLE_MS = 1900;

interface Props {
  mood: SpendingMood;
  /** 가족이 고른 사진. 없으면(또는 지워졌으면) 뒤집히지 않고 간지럼만 탄다 */
  photo: Memory | null;
  className?: string;
}

/**
 * 미쿠 카드 — 춤추는 미쿠가 곧 버튼이다.
 *  - 사진이 있으면: 누르면 3D로 뒤집혀 폴라로이드가 나온다. 다시 누르기·Esc·'다시 뒤집기'로 돌아온다.
 *    뒤집혀 있는 동안 춤은 잠깐 멈춘다.
 *  - 사진이 없으면: 폴짝 뛰고 하트·음표가 톡 터지며 "헤헤, 간지러워!" (한 번만)
 * 박스 크기는 그대로라 앞뒤가 바뀌어도 레이아웃이 흔들리지 않는다.
 */
export function MikuCard({ mood, photo, className = '' }: Props) {
  // 어떤 사진을 뒤집어 보고 있는지 — 사진이 바뀌거나 사라지면 저절로 앞면
  const [flippedId, setFlippedId] = useState<string | null>(null);
  const flipped = photo !== null && flippedId === photo.id;

  // 간지럼: poke는 누를 때마다 1씩 (폴짝 애니메이션을 처음부터 다시 틀기 위해)
  const [poke, setPoke] = useState(0);
  const [giggling, setGiggling] = useState(false);
  const giggleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const frontRef = useRef<HTMLButtonElement>(null);
  const backRef = useRef<HTMLButtonElement>(null);
  const focusNext = useRef<'front' | 'back' | null>(null);

  useEffect(
    () => () => {
      if (giggleTimer.current) clearTimeout(giggleTimer.current);
    },
    []
  );

  // 뒤집힌 면은 inert라 포커스를 잃는다 — 보이는 면으로 옮겨 준다
  useEffect(() => {
    const target = focusNext.current;
    if (!target) return;
    focusNext.current = null;
    (target === 'back' ? backRef : frontRef).current?.focus({ preventScroll: true });
  }, [flipped]);

  function press() {
    if (photo) {
      focusNext.current = 'back';
      setFlippedId(photo.id);
      return;
    }
    setPoke((n) => n + 1);
    setGiggling(true);
    if (giggleTimer.current) clearTimeout(giggleTimer.current);
    giggleTimer.current = setTimeout(() => setGiggling(false), GIGGLE_MS);
  }

  function flipBack() {
    focusNext.current = 'front';
    setFlippedId(null);
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Escape' && flipped) {
      e.preventDefault();
      e.stopPropagation();
      flipBack();
    }
  }

  // 같은 이름의 애니메이션은 다시 틀어지지 않으므로 두 이름을 번갈아 쓴다
  const hop = poke === 0 ? '' : poke % 2 === 1 ? 'miku-hop-a' : 'miku-hop-b';

  return (
    <div
      className={`miku-card ${className}`}
      data-flipped={flipped ? '' : undefined}
      onKeyDown={onKeyDown}
    >
      <div className="miku-card-inner">
        {/* 앞면: 춤추는 미쿠 */}
        <button
          ref={frontRef}
          type="button"
          className="miku-face miku-face-front"
          aria-label="미쿠 카드 뒤집기"
          onClick={press}
          inert={flipped}
        >
          <span className={`miku-hop ${hop}`}>
            <DancingMascot mood={mood} giggling={giggling} className="h-full w-full" />
          </span>
          {giggling && <MikuGiggle key={poke} />}
        </button>

        {/* 뒷면: 가족이 고른 사진 한 장 (어디를 눌러도 다시 앞면으로) */}
        {photo && (
          <div className="miku-face miku-face-back" inert={!flipped} onClick={flipBack}>
            <MikuPolaroid photo={photo} />
            <button
              ref={backRef}
              type="button"
              className="miku-flipback"
              onClick={(e) => {
                e.stopPropagation();
                flipBack();
              }}
            >
              <RotateCcw className="h-3 w-3" aria-hidden="true" />
              {/* 좁은 화면에선 글자를 숨기고 동그란 아이콘만 (이름은 그대로 읽힌다) */}
              <span className="miku-flipback-label">다시 뒤집기</span>
            </button>
          </div>
        )}
      </div>

      {/* 화면 읽기 프로그램에도 웃음소리를 */}
      <span className="sr-only" aria-live="polite">
        {giggling ? GIGGLE_LINE : ''}
      </span>
    </div>
  );
}

/** 뒷면 폴라로이드 — 기울기는 사진 id에서 나와 언제 봐도 같다 */
function MikuPolaroid({ photo }: { photo: Memory }) {
  const [broken, setBroken] = useState(false);
  const t = storyTilt(photo.id);
  const tilt = (t >= 0 ? 1 : -1) * (1.5 + Math.abs(t) * 0.5); // ±1.5° ~ ±3°
  const caption = photo.caption.trim();
  const date = formatMemoryDate(photo.taken_at);

  return (
    <figure className="miku-polaroid" style={{ ['--miku-tilt' as string]: `${tilt}deg` } as CSSProperties}>
      <span className="miku-tape" aria-hidden="true" />
      <span className="miku-photo">
        {!broken && (
          // eslint-disable-next-line @next/next/no-img-element -- 이미 줄여 둔 WebP 썸네일
          <img
            src={photo.thumb_url}
            width={photo.width}
            height={photo.height}
            alt={caption ? `${caption} 사진` : '미쿠 카드 사진'}
            loading="lazy"
            decoding="async"
            draggable={false}
            onError={() => setBroken(true)}
          />
        )}
      </span>
      <figcaption className="miku-polaroid-text">
        <span className={`${handwriting.className} miku-polaroid-line`}>{BACK_LINE}</span>
        <span className="miku-polaroid-meta">
          {caption && <span className="miku-polaroid-caption">{caption}</span>}
          {caption && <span aria-hidden="true">·</span>}
          <span className="shrink-0">{date}</span>
        </span>
      </figcaption>
    </figure>
  );
}

/** 간지럼 한 번 — 말풍선 + 하트·음표가 톡 (다시 누르면 key가 바뀌어 처음부터) */
function MikuGiggle() {
  return (
    <span className="miku-giggle" aria-hidden="true">
      <span className="miku-giggle-bubble">{GIGGLE_LINE}</span>
      <span className="miku-pop miku-pop-1">
        <PopHeart fill="#F2789E" />
      </span>
      <span className="miku-pop miku-pop-2">♪</span>
      <span className="miku-pop miku-pop-3">
        <PopHeart fill="#F79DBA" />
      </span>
      <span className="miku-pop miku-pop-4">♫</span>
    </span>
  );
}

function PopHeart(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="-11 -11 22 20" width="16" height="15" {...props}>
      <path
        d="M0 7 C-1 6.2 -9 1 -9 -3.4 C-9 -6.8 -6.6 -8.6 -4.3 -8.6 C-2.3 -8.6 -0.8 -7.4 0 -6 C0.8 -7.4 2.3 -8.6 4.3 -8.6 C6.6 -8.6 9 -6.8 9 -3.4 C9 1 1 6.2 0 7 Z"
        stroke="#FFFFFF"
        strokeWidth="2.4"
        strokeLinejoin="round"
        paintOrder="stroke"
      />
      <ellipse cx="-4.2" cy="-4.4" rx="2" ry="1.3" fill="#FFFFFF" opacity="0.6" transform="rotate(-35 -4.2 -4.4)" />
    </svg>
  );
}
