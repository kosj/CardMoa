import type { CSSProperties } from 'react';
import './hero.css';

/**
 * 아빠와 딸이 손을 잡고 노을 진 캠퍼스 길을 걸어가는 뒷모습 일러스트.
 *
 * - 순수 SVG + CSS (hero.css). 랜딩 페이지에서 유일하게 반복되는 모션이라
 *   걸음·팔 흔들림·하트·햇무리 모두 느리고 잔잔하게 움직인다.
 * - 얼굴 없는 뒷모습. 옷차림만 우리 가족을 닮게 그렸다:
 *   은별이는 데님 뉴스보이 캡·베이지 트렌치코트·키링 달린 크림 백팩·연회색 바지,
 *   아빠는 회색 집업 후디·어두운 바지, 둘 다 흰 운동화.
 *   (사진은 참고만 했고 저장소에는 넣지 않는다)
 * - 가방 키링은 걸음 루프에 맞춰 달랑거린다.
 * - prefers-reduced-motion이면 하트 하나가 손 위에 떠 있는 정지 장면.
 * - 장식용이므로 aria-hidden — 의미는 주변 문구가 전달한다.
 *
 * 좌표계: viewBox 0 0 600 500, 지평선 y=290, 두 사람의 발 y≈446.
 * 움직이는 요소는 transform-box: fill-box 로 자기 영역 기준으로 변형된다.
 */

const FRAME_PATH =
  'M0 472 L0 200 C0 90 134 18 300 18 C466 18 600 90 600 200 L600 472 Q600 500 572 500 L28 500 Q0 500 0 472 Z';

const PETALS = [
  { cx: 468, cy: 128, rotate: 20, fill: '#F7A3B5', delay: '-2s', duration: '16s' },
  { cx: 132, cy: 212, rotate: -30, fill: '#FBC3CE', delay: '-9s', duration: '18s' },
  { cx: 520, cy: 352, rotate: 45, fill: '#F59FB1', delay: '-5s', duration: '15s' },
  { cx: 86, cy: 380, rotate: 10, fill: '#FBC3CE', delay: '-12.5s', duration: '17s' },
];

const SKIN_GIRL = '#F7D0B8';
const SKIN_DAD = '#EDBB9C';

// 은별 — 데님 뉴스보이 캡, 베이지 트렌치코트, 크림 백팩, 연회색 바지 (노을빛에 맞춰 채도를 살짝 낮춤)
const HAIR_GIRL = '#3E2A28';
const DENIM = '#7389AE';
const DENIM_SHADE = '#5D7298';
const DENIM_LIGHT = '#A2B2CF';
const TRENCH = '#DCC19B';
const TRENCH_SHADE = '#C9AA80';
const TRENCH_SLEEVE = '#D5B98F';
const TRENCH_DARK = '#B39068';
const BAG = '#F8F1DE';
const BAG_SHADE = '#E9DFC3';
const BAG_POCKET = '#EFE6CC';
const BAG_SEAM = '#D3C49F';
const BAG_STRAP = '#EEE4C8';
const CHARM_CHAIN = '#C9A36A';
const PLUSH = '#F29FB5';
const PLUSH_LIGHT = '#F8BFCD';
const PANTS = '#CDC8CE';
const PANTS_IN = '#C0BBC3';
const PANTS_FOLD = '#AFA9B2';

// 아빠 — 회색 집업 후디, 어두운 바지, 짧은 짙은 갈색 머리
const HAIR_DAD = '#4A352E';
const HAIR_DAD_LIGHT = '#7A5A4A';
const HOODIE = '#ABA8B0';
const HOODIE_SHADE = '#9C99A3';
const HOODIE_SLEEVE = '#A5A2AB';
const HOODIE_RIB = '#928F9A';
const HOOD = '#B4B1B9';
const TROUSERS = '#4D4A5B';
const TROUSERS_IN = '#454253';

// 두 사람 모두 흰 운동화
const SNEAKER = '#FFFDF8';
const SNEAKER_EDGE = '#E8D9CE';
const SNEAKER_TAB = '#DDD3CB';
const SOLE = '#E6DCD3';

export function FatherDaughterHero({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 600 500"
      className={`hero-scene block h-auto w-full ${className}`}
      aria-hidden="true"
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="hero-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F7CBD5" />
          <stop offset="0.38" stopColor="#FAD6CB" />
          <stop offset="0.72" stopColor="#FDE3CC" />
          <stop offset="1" stopColor="#FFEFD8" />
        </linearGradient>
        <radialGradient id="hero-glow">
          <stop offset="0" stopColor="#FFF8E8" stopOpacity="1" />
          <stop offset="0.3" stopColor="#FFEBC8" stopOpacity="0.85" />
          <stop offset="1" stopColor="#FFDDB5" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="hero-sun" cx="0.5" cy="0.45" r="0.55">
          <stop offset="0" stopColor="#FFF6DC" />
          <stop offset="0.7" stopColor="#FFE2AE" />
          <stop offset="1" stopColor="#FFD495" />
        </radialGradient>
        <linearGradient id="hero-ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F2C1AE" />
          <stop offset="1" stopColor="#E39E98" />
        </linearGradient>
        <linearGradient id="hero-path" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFF4E2" />
          <stop offset="1" stopColor="#F9DCC9" />
        </linearGradient>
        <linearGradient id="hero-shadow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#A75F70" stopOpacity="0.32" />
          <stop offset="1" stopColor="#A75F70" stopOpacity="0" />
        </linearGradient>
        <clipPath id="hero-frame">
          <path d={FRAME_PATH} />
        </clipPath>
      </defs>

      <g clipPath="url(#hero-frame)">
        {/* ── 하늘 ───────────────────────── */}
        <rect width="600" height="500" fill="url(#hero-sky)" />

        {/* 구름 */}
        <g fill="#FFF4EA" opacity="0.72">
          <rect x="62" y="118" width="128" height="11" rx="5.5" />
          <rect x="98" y="107" width="62" height="11" rx="5.5" />
          <rect x="392" y="84" width="138" height="10" rx="5" />
          <rect x="436" y="74" width="58" height="10" rx="5" />
          <rect x="344" y="168" width="84" height="7" rx="3.5" opacity="0.7" />
        </g>

        {/* 새 두 마리 */}
        <g fill="none" stroke="#C98A92" strokeWidth="1.6" strokeLinecap="round" opacity="0.7">
          <path d="M424 132 q4 -4.5 8 0 q4 -4.5 8 0" />
          <path d="M446 146 q3 -3.5 6 0 q3 -3.5 6 0" />
        </g>

        {/* 해 + 숨 쉬는 햇무리 */}
        <circle className="hero-anim hero-sun-glow" cx="300" cy="284" r="180" fill="url(#hero-glow)" />
        <circle cx="300" cy="286" r="58" fill="#FFE9C4" opacity="0.55" />
        <circle cx="300" cy="286" r="46" fill="url(#hero-sun)" />

        {/* 먼 언덕 (가운데는 비워 해가 지평선에 걸리게) */}
        <path d="M0 268 C60 256 120 262 180 272 C214 278 240 284 262 290 L0 290 Z" fill="#F3C4B7" />
        <path d="M600 262 C540 254 470 262 420 274 C390 281 360 286 338 290 L600 290 Z" fill="#F3C4B7" />

        {/* 멀리 보이는 대학 건물 (시계탑) */}
        <g fill="#E9AFB2">
          <rect x="92" y="256" width="120" height="34" />
          <rect x="88" y="251" width="128" height="6" rx="1.5" />
          <rect x="140" y="204" width="24" height="48" />
          <rect x="137" y="199" width="30" height="6" rx="1.5" />
          <path d="M139 199 L152 176 L165 199 Z" />
          <rect x="151.2" y="168" width="1.6" height="9" />
        </g>
        <g fill="#F7D6CB">
          <circle cx="152" cy="219" r="6.2" />
          {[100, 114, 128, 170, 184, 198].map((x) => (
            <path key={x} d={`M${x} 280 L${x} 268 a3.5 3.5 0 0 1 7 0 L${x + 7} 280 Z`} />
          ))}
          <path d="M145 290 L145 274 a7 7 0 0 1 14 0 L159 290 Z" />
        </g>
        <path d="M152 219 L152 215 M152 219 L155 220.5" stroke="#E9AFB2" strokeWidth="1.2" strokeLinecap="round" />

        {/* 먼 나무 줄 (오른쪽 지평선) */}
        <g fill="#EDB8B4">
          <circle cx="404" cy="279" r="10" />
          <circle cx="420" cy="282" r="8" />
          <circle cx="516" cy="270" r="13" />
          <circle cx="536" cy="275" r="10" />
        </g>

        {/* ── 땅 ───────────────────────── */}
        <rect x="0" y="290" width="600" height="210" fill="url(#hero-ground)" />

        {/* 지평선으로 좁아지는 캠퍼스 길 */}
        <path d="M293 290 L307 290 L480 500 L120 500 Z" fill="url(#hero-path)" />
        <g stroke="#F0C9B5" strokeLinecap="round" opacity="0.7">
          <path d="M286.4 298 L313.6 298" strokeWidth="0.8" />
          <path d="M276.5 310 L323.5 310" strokeWidth="1" />
          <path d="M263.3 326 L336.7 326" strokeWidth="1.2" />
          <path d="M245.2 348 L354.8 348" strokeWidth="1.4" />
          <path d="M220.5 378 L379.5 378" strokeWidth="1.6" />
          <path d="M187.6 418 L412.4 418" strokeWidth="1.8" />
          <path d="M144.7 470 L455.3 470" strokeWidth="2" />
        </g>
        <g stroke="#EBBBA6" strokeWidth="2.5" strokeLinecap="round">
          <path d="M293 290 L120 500" />
          <path d="M307 290 L480 500" />
        </g>

        {/* 오른쪽 중간 나무 */}
        <rect x="437.5" y="268" width="5" height="56" rx="2.5" fill="#B9787F" />
        <ellipse cx="440" cy="250" rx="28" ry="33" fill="#DD9CA2" />
        <ellipse cx="431" cy="243" rx="15" ry="19" fill="#E8AFAF" opacity="0.7" />

        {/* 오른쪽 가까운 큰 나무 */}
        <path d="M553 500 L558 300 C558 292 566 292 566 300 L573 500 Z" fill="#A9686F" />
        <path d="M563 362 L583 334" stroke="#A9686F" strokeWidth="6" strokeLinecap="round" />
        <g fill="#D08996">
          <circle cx="552" cy="226" r="54" />
          <circle cx="598" cy="268" r="46" />
          <circle cx="508" cy="268" r="34" />
          <circle cx="556" cy="292" r="34" />
        </g>
        <circle cx="526" cy="232" r="30" fill="#DE9EA6" opacity="0.8" />
        <circle cx="508" cy="262" r="20" fill="#E3A9AC" opacity="0.6" />

        {/* 왼쪽 가까운 나무 */}
        <path d="M24 500 L30 318 C30 311 38 311 38 318 L42 500 Z" fill="#A9686F" />
        <g fill="#D08996">
          <circle cx="22" cy="262" r="48" />
          <circle cx="62" cy="300" r="32" />
          <circle cx="-8" cy="318" r="40" />
        </g>
        <circle cx="52" cy="262" r="26" fill="#DE9EA6" opacity="0.8" />

        {/* 잔디밭의 작은 꽃 */}
        <g>
          <circle cx="78" cy="468" r="3" fill="#FFF4EA" />
          <circle cx="92" cy="478" r="2.6" fill="#F7A6B6" />
          <circle cx="66" cy="482" r="2.4" fill="#F7A6B6" />
          <circle cx="150" cy="392" r="2.2" fill="#FFF4EA" />
          <circle cx="160" cy="398" r="1.8" fill="#F7A6B6" />
          <circle cx="448" cy="396" r="2" fill="#F7A6B6" />
          <circle cx="458" cy="390" r="2.2" fill="#FFF4EA" />
          <circle cx="512" cy="472" r="2.6" fill="#F7A6B6" />
          <circle cx="526" cy="482" r="3" fill="#FFF4EA" />
          <circle cx="500" cy="486" r="2.4" fill="#FFF4EA" />
        </g>

        {/* ── 두 사람 (발밑 기준으로 살짝 키워 주인공으로) ── */}
        <g transform="translate(300 446) scale(1.12) translate(-300 -446)">
          {/* 해를 등지고 걸어서 그림자가 이쪽으로 길게 드리운다 */}
          <g fill="url(#hero-shadow)">
            <path d="M238 444 L266 444 L258 500 L212 500 Z" />
            <path d="M330 444 L370 444 L398 500 L342 500 Z" />
          </g>
          <g fill="#A75F70" opacity="0.18">
            <ellipse cx="252" cy="446" rx="17" ry="2.6" />
            <ellipse cx="350" cy="446" rx="22" ry="2.8" />
          </g>

          {/* ── 딸 은별: 데님 뉴스보이 캡, 긴 생머리, 베이지 트렌치코트, 크림 백팩 ── */}
          <g className="hero-girl">
            {/* 바깥쪽 다리 (연회색 바지 + 흰 운동화) */}
            <g className="hero-anim hero-leg hero-leg-a">
              <path d="M233 334 L252 334 L251.7 352 C251.3 382 250.9 410 250.7 436.5 L238.6 436.5 C238 410 236.4 380 233.4 354 C232.6 346 232.6 340 233 334 Z" fill={PANTS} />
              <path d="M239.2 428.4 Q244.7 430.6 250.4 428.4" fill="none" stroke={PANTS_FOLD} strokeWidth="1" strokeLinecap="round" />
              <rect x="237.6" y="432.6" width="14" height="13.4" rx="5" fill={SNEAKER} stroke={SNEAKER_EDGE} strokeWidth="0.8" />
              <rect x="237.6" y="442" width="14" height="4" rx="2" fill={SOLE} />
              <rect x="242.6" y="432.6" width="4" height="3.6" rx="1.2" fill={SNEAKER_TAB} />
            </g>
            {/* 안쪽 다리 */}
            <g className="hero-anim hero-leg hero-leg-b">
              <path d="M252 334 L271 334 C271.4 340 271.4 346 270.6 354 C267.6 380 266 410 265.4 436.5 L253.3 436.5 C253.1 410 252.7 382 252.3 352 Z" fill={PANTS_IN} />
              <path d="M253.6 428.4 Q259.2 430.6 265 428.4" fill="none" stroke={PANTS_FOLD} strokeWidth="1" strokeLinecap="round" />
              <rect x="252.4" y="432.6" width="14" height="13.4" rx="5" fill={SNEAKER} stroke={SNEAKER_EDGE} strokeWidth="0.8" />
              <rect x="252.4" y="442" width="14" height="4" rx="2" fill={SOLE} />
              <rect x="257.4" y="432.6" width="4" height="3.6" rx="1.2" fill={SNEAKER_TAB} />
            </g>

            {/* 상체 — 걸음에 맞춰 살짝 오르내림 */}
            <g className="hero-anim hero-walk">
              {/* 짧은 베이지 트렌치코트 (엉덩이를 살짝 덮는 A라인) */}
              <path d="M231 284 C231 275 237 271 245 270 L259 270 C267 271 273 275 273 284 L272.7 318 C273.3 328 274 338 274.6 348.5 L229.4 348.5 C230 338 230.7 328 231.3 318 Z" fill={TRENCH} />
              <path d="M266 272 C270.6 274 273 278 273 284 L272.7 318 C273.3 328 274 338 274.6 348.5 L268.8 348.5 C269.4 326 268.8 296 266 272 Z" fill={TRENCH_SHADE} opacity="0.55" />
              {/* 허리 벨트 (가방 양옆으로 보인다) */}
              <rect x="230.7" y="318.6" width="42.6" height="4.6" rx="1.5" fill={TRENCH_DARK} />
              {/* 뒤트임 + 밑단 스티치 */}
              <path d="M252 331 L252 348.5" stroke={TRENCH_DARK} strokeWidth="1.1" />
              <path d="M230 345.4 Q252 347 274 345.4" fill="none" stroke={TRENCH_SHADE} strokeWidth="0.9" strokeDasharray="1.6 1.4" />

              {/* 크림색 백팩 — 어깨끈 */}
              <path d="M236.4 271.2 L241.6 270.2 L241.2 286 L236 286 Z" fill={BAG_STRAP} />
              <path d="M262.4 270.2 L267.6 271.2 L268 286 L262.8 286 Z" fill={BAG_STRAP} />
              {/* 가방 몸통 (윗부분은 머리카락에 가려진다) */}
              <rect x="233.2" y="279" width="37.6" height="52" rx="11" fill={BAG} />
              <rect x="233.2" y="279" width="6" height="52" rx="3" fill={BAG_SHADE} opacity="0.75" />
              {/* 앞주머니 */}
              <rect x="238.4" y="306.4" width="27.2" height="21" rx="7" fill={BAG_POCKET} />
              <path d="M241 311.8 Q252 307.8 263 311.8" fill="none" stroke={BAG_SEAM} strokeWidth="1.2" strokeLinecap="round" />
              <rect x="244.6" y="309.4" width="2.2" height="4.2" rx="1" fill={BAG_SEAM} />

              {/* 가방에 매단 키링들 — 걸음에 맞춰 달랑달랑 */}
              <rect x="261.3" y="326.2" width="2.4" height="3.4" rx="1" fill={BAG_SEAM} />
              <g className="hero-anim hero-charm">
                <circle cx="262.5" cy="329.6" r="1.7" fill="none" stroke={CHARM_CHAIN} strokeWidth="0.9" />
                {/* 분홍 곰 인형 (뒷모습) */}
                <g className="hero-anim hero-charm hero-charm-b">
                  <path d="M261.4 331 L259.2 333.2" stroke={CHARM_CHAIN} strokeWidth="0.8" strokeLinecap="round" />
                  <circle cx="256.9" cy="333.4" r="1.45" fill={PLUSH} />
                  <circle cx="261.5" cy="333.4" r="1.45" fill={PLUSH} />
                  <circle cx="259.2" cy="335.6" r="3.2" fill={PLUSH} />
                  <ellipse cx="259.2" cy="340.6" rx="2.8" ry="2.5" fill={PLUSH_LIGHT} />
                  <circle cx="259.2" cy="342.4" r="0.9" fill={PLUSH} />
                </g>
                {/* 작은 별 — '은별' */}
                <g className="hero-anim hero-charm hero-charm-c">
                  <path d="M263.6 331 L265.8 333.4" stroke={CHARM_CHAIN} strokeWidth="0.8" strokeLinecap="round" />
                  <path
                    d="M265.8 332.8 L266.9 335.4 L269.6 335.6 L267.5 337.3 L268.2 340 L265.8 338.5 L263.4 340 L264.1 337.3 L262 335.6 L264.7 335.4 Z"
                    fill="#FFE7A6"
                    stroke="#E7B566"
                    strokeWidth="0.5"
                    strokeLinejoin="round"
                  />
                </g>
              </g>

              {/* 긴 생머리 (모자 아래로 가방 위에 내려온다) */}
              <path d="M239 250 C238.4 258 237.2 265 236.4 272 C235.4 282 235.8 293 236.8 302 C242 306.4 247 305 252 307 C257 305 262 306.4 267.2 302 C268.2 293 268.6 282 267.6 272 C266.8 265 265.6 258 265 250 Z" fill={HAIR_GIRL} />
              <g fill="none" stroke="#2E1F1D" strokeWidth="1.1" strokeLinecap="round" opacity="0.55">
                <path d="M252 262 C251.6 276 251.2 290 250.8 303" />
                <path d="M244.2 262 C242.6 276 241.6 288 241.4 299" />
                <path d="M259.8 262 C261.4 276 262.4 288 262.6 299" />
              </g>
              {/* 노을빛 머리 테두리 */}
              <path d="M265.8 258 C266.6 263.6 267.4 268.6 268 274" fill="none" stroke="#F7C9A8" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />

              {/* 데님 뉴스보이 캡 — 뒤에서 본 밴드와 둥근 크라운 */}
              <path d="M237 249.6 C242.5 254.6 261.5 254.6 267 249.6 L267.4 255.2 C261.6 259.8 242.4 259.8 236.6 255.2 Z" fill={DENIM_SHADE} />
              <path d="M238.6 256 C244 259.2 260 259.2 265.4 256" fill="none" stroke={DENIM_LIGHT} strokeWidth="0.7" strokeDasharray="1.4 1.3" opacity="0.85" />
              <path d="M233.4 250.6 C230.8 242.6 236.4 233 252 232.4 C267.6 233 273.2 242.6 270.6 250.6 C265 255.4 239 255.4 233.4 250.6 Z" fill={DENIM} />
              <g fill="none" stroke={DENIM_SHADE} strokeWidth="0.9" strokeLinecap="round" opacity="0.85">
                <path d="M252 233.6 C246 238 241.6 245 240.6 253.4" />
                <path d="M252 233.6 L252 254.2" />
                <path d="M252 233.6 C258 238 262.4 245 263.4 253.4" />
              </g>
              <path d="M237.6 243.4 C239.6 238 244.6 235 250 234.4" fill="none" stroke={DENIM_LIGHT} strokeWidth="1.6" strokeLinecap="round" opacity="0.7" />
              <circle cx="252" cy="233.2" r="1.8" fill={DENIM_SHADE} />
              <path d="M262.6 234.6 C268 237.4 271.6 243 270.8 249.6" fill="none" stroke="#F7C9A8" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />

              {/* 바깥 팔 (자유롭게 흔들림) */}
              <g className="hero-anim hero-arm-free">
                <path d="M233.5 280 Q229.6 296 228.6 309 Q227.4 322 226.2 333" fill="none" stroke={TRENCH_SLEEVE} strokeWidth="10" strokeLinecap="round" />
                <path d="M226.7 328.4 L226.2 334" fill="none" stroke={TRENCH_SHADE} strokeWidth="10.2" />
                <path d="M226.9 325.6 L226.7 327.8" fill="none" stroke={TRENCH_DARK} strokeWidth="10.2" />
                <circle cx="226" cy="339.2" r="4.5" fill={SKIN_GIRL} />
              </g>
              {/* 아빠와 맞잡은 팔 */}
              <g className="hero-anim hero-arm-joined">
                <path d="M270.5 280 Q276.4 297 282.4 309 Q288.6 321.5 294.6 332" fill="none" stroke={TRENCH_SLEEVE} strokeWidth="10" strokeLinecap="round" />
                <path d="M292.2 327.6 L295 332.6" fill="none" stroke={TRENCH_SHADE} strokeWidth="10.2" />
                <path d="M290.6 324.8 L291.7 326.8" fill="none" stroke={TRENCH_DARK} strokeWidth="10.2" />
              </g>
            </g>
          </g>

          {/* ── 아빠: 회색 집업 후디, 어두운 바지, 흰 운동화 ───────────── */}
          <g className="hero-dad">
            {/* 안쪽 다리 */}
            <g className="hero-anim hero-leg hero-leg-b">
              <path d="M326 332 L350 332 L349.5 350 C348.6 382 347.6 410 347.2 437 L332 437 C331.2 410 329.4 380 326.8 352 C326 344 325.8 338 326 332 Z" fill={TROUSERS_IN} />
              <rect x="330" y="431.6" width="18.8" height="14.4" rx="5.6" fill={SNEAKER} stroke={SNEAKER_EDGE} strokeWidth="0.8" />
              <rect x="330" y="442" width="18.8" height="4" rx="2" fill={SOLE} />
              <rect x="337.2" y="431.6" width="4.4" height="3.8" rx="1.3" fill={SNEAKER_TAB} />
            </g>
            {/* 바깥쪽 다리 */}
            <g className="hero-anim hero-leg hero-leg-a">
              <path d="M350 332 L374 332 C374.2 338 374 344 373.2 352 C370.6 380 368.8 410 368 437 L352.8 437 C352.4 410 351.4 382 350.5 350 Z" fill={TROUSERS} />
              <rect x="351.2" y="431.6" width="18.8" height="14.4" rx="5.6" fill={SNEAKER} stroke={SNEAKER_EDGE} strokeWidth="0.8" />
              <rect x="351.2" y="442" width="18.8" height="4" rx="2" fill={SOLE} />
              <rect x="358.4" y="431.6" width="4.4" height="3.8" rx="1.3" fill={SNEAKER_TAB} />
            </g>

            <g className="hero-anim hero-walk">
              {/* 회색 집업 후디 */}
              <path d="M319 270 C319 259 326 253.5 336 252 L364 252 C374 253.5 381 259 381 270 L377.5 314 C377 323 376.5 331 376 338.5 L324 338.5 C323.5 331 323 323 322.5 314 Z" fill={HOODIE} />
              <path d="M369.5 253 C376.5 255.5 381 261 381 270 L377.5 314 C377 323 376.5 331 376 338.5 L368.5 338.5 C370 314 370.8 284 369.5 253 Z" fill={HOODIE_SHADE} opacity="0.6" />
              <rect x="323.6" y="330.6" width="52.8" height="7.9" rx="3" fill={HOODIE_RIB} />
              <g stroke={HOODIE_SHADE} strokeWidth="0.8" opacity="0.6">
                {[330, 337, 344, 351, 358, 365, 372].map((x) => (
                  <path key={x} d={`M${x} 331.8 L${x} 337.4`} />
                ))}
              </g>
              {/* 목 */}
              <rect x="342.5" y="236" width="15" height="16" rx="4" fill={SKIN_DAD} />
              {/* 등에 내려앉은 후드 */}
              <path d="M333.4 255 C332.6 266.6 336 279.2 343.2 285.2 C346.8 288.2 353.2 288.2 356.8 285.2 C364 279.2 367.4 266.6 366.6 255 Z" fill={HOODIE_SHADE} opacity="0.9" />
              <path d="M333.4 253.4 C332.6 265 336 277.6 343.2 283.6 C346.8 286.6 353.2 286.6 356.8 283.6 C364 277.6 367.4 265 366.6 253.4 Z" fill={HOOD} />
              <path d="M350 258 L350 286" stroke={HOODIE_RIB} strokeWidth="1" opacity="0.75" />
              <path d="M364.8 259 C365 267 362.6 275.6 358 281.4" fill="none" stroke="#F7C9A8" strokeWidth="1.1" strokeLinecap="round" opacity="0.5" />
              {/* 후드 테두리가 목을 감싼다 */}
              <path d="M334.6 252.8 C340.6 258.6 359.4 258.6 365.4 252.8 L363.6 248.8 C357.6 253.8 342.4 253.8 336.4 248.8 Z" fill={HOODIE_RIB} />
              {/* 귀 */}
              <ellipse cx="335.4" cy="229.5" rx="3.3" ry="5.4" fill={SKIN_DAD} />
              <ellipse cx="364.6" cy="229.5" rx="3.3" ry="5.4" fill={SKIN_DAD} />
              {/* 짧은 짙은 갈색 머리 (윗머리에 볼륨) */}
              <path d="M350 211.6 C339.6 211.6 334.4 219 334.5 228.4 C334.5 236 337 241.5 341 243.5 C344 244.6 356 244.6 359 243.5 C363 241.5 365.5 236 365.5 228.4 C365.6 219 360.4 211.6 350 211.6 Z" fill={HAIR_DAD} />
              <g fill="none" strokeLinecap="round">
                <path d="M343 217 Q350 213.4 357 217" stroke={HAIR_DAD_LIGHT} strokeWidth="1.6" />
                <path d="M340.4 238.6 Q350 241.4 359.6 238.6" stroke="#3A2924" strokeWidth="1" opacity="0.6" />
                {/* 노을빛 테두리 */}
                <path d="M341 215.4 C337 218.6 335 223.4 334.8 228.6" stroke="#F7C9A8" strokeWidth="1.2" opacity="0.7" />
              </g>

              {/* 바깥 팔 */}
              <g className="hero-anim hero-arm-free">
                <path d="M377.2 268 Q382.6 283 384.2 299 Q385.4 316 385.8 330" fill="none" stroke={HOODIE_SLEEVE} strokeWidth="12.5" strokeLinecap="round" />
                <path d="M385.7 324.6 L385.8 331" fill="none" stroke={HOODIE_RIB} strokeWidth="12.7" />
                <circle cx="385.9" cy="336.8" r="5.3" fill={SKIN_DAD} />
              </g>
              {/* 딸과 맞잡은 팔 */}
              <g className="hero-anim hero-arm-joined">
                <path d="M322.8 268 Q317 283 313.4 299 Q309.6 315.5 304.4 330" fill="none" stroke={HOODIE_SLEEVE} strokeWidth="12.5" strokeLinecap="round" />
                <path d="M306.3 324.8 L304.2 330.6" fill="none" stroke={HOODIE_RIB} strokeWidth="12.7" />
              </g>
            </g>
          </g>

          {/* 맞잡은 두 손 */}
          <g className="hero-anim hero-walk">
            <g className="hero-anim hero-hands">
              <ellipse cx="297.2" cy="337.6" rx="5" ry="5.6" fill={SKIN_GIRL} />
              <ellipse cx="301.6" cy="336.8" rx="6.2" ry="6.6" fill={SKIN_DAD} />
            </g>
          </g>

          {/* 맞잡은 손에서 피어오르는 하트 */}
          <path
            className="hero-anim hero-heart"
            d="M298 305 C291.4 300.5 289 297 289 294 C289 291.2 291.1 289.3 293.6 289.3 C295.5 289.3 297 290.4 298 291.9 C299 290.4 300.5 289.3 302.4 289.3 C304.9 289.3 307 291.2 307 294 C307 297 304.6 300.5 298 305 Z"
            fill="#F0668A"
          />
        </g>

        {/* 흩날리는 꽃잎 */}
        {PETALS.map((p, i) => (
          <ellipse
            key={i}
            className="hero-anim hero-petal"
            cx={p.cx}
            cy={p.cy}
            rx="3.4"
            ry="1.9"
            fill={p.fill}
            style={
              {
                '--hero-petal-rot': `${p.rotate}deg`,
                animationDelay: p.delay,
                animationDuration: p.duration,
              } as CSSProperties
            }
          />
        ))}
      </g>

      {/* 아치형 창틀 테두리 */}
      <path d={FRAME_PATH} fill="none" stroke="#FFFFFF" strokeOpacity="0.7" strokeWidth="5" />
    </svg>
  );
}

export default FatherDaughterHero;
