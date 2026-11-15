import type { CSSProperties } from 'react';
import './hero.css';

/**
 * 아빠와 딸이 손을 잡고 노을 진 캠퍼스 길을 걸어가는 뒷모습 일러스트.
 *
 * - 순수 SVG + CSS (hero.css). 랜딩 페이지에서 유일하게 반복되는 모션이라
 *   걸음·팔 흔들림·하트·햇무리 모두 느리고 잔잔하게 움직인다.
 * - 얼굴 없는 뒷모습: 누구나 자기 이야기로 볼 수 있게, 실제 인물을 닮지 않게.
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
const SWEATER = '#FFF1E2';
const SWEATER_SLEEVE = '#F7E2CC';
const SWEATER_RIB = '#EFD5BC';
const CARDIGAN = '#8A6C96';
const CARDIGAN_SLEEVE = '#82668F';
const CARDIGAN_RIB = '#735780';

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

          {/* ── 딸: 긴 머리, 리본, 백팩 ───────────── */}
          <g className="hero-girl">
            {/* 바깥쪽 다리 (청바지 + 운동화) */}
            <g className="hero-anim hero-leg hero-leg-a">
              <path d="M233 334 L252 334 L251.5 352 C251 382 250.2 410 249.8 437 L240 437 C239.4 410 237.5 380 233.5 354 C232.6 346 232.6 340 233 334 Z" fill="#8E93BE" />
              <rect x="238.2" y="433" width="13.4" height="13" rx="5" fill="#FFF8EE" />
              <rect x="238.2" y="442" width="13.4" height="4" rx="2" fill="#E6CBBC" />
              <rect x="243" y="433" width="3.8" height="4" rx="1.2" fill="#F08A9B" />
            </g>
            {/* 안쪽 다리 */}
            <g className="hero-anim hero-leg hero-leg-b">
              <path d="M252 334 L271 334 C271.4 340 271.4 346 270.5 354 C266.5 380 264.6 410 264 437 L254.2 437 C253.8 410 253 382 252.5 352 Z" fill="#858AB6" />
              <rect x="252.6" y="433" width="13.4" height="13" rx="5" fill="#FFF8EE" />
              <rect x="252.6" y="442" width="13.4" height="4" rx="2" fill="#E6CBBC" />
              <rect x="257.4" y="433" width="3.8" height="4" rx="1.2" fill="#F08A9B" />
            </g>

            {/* 상체 — 걸음에 맞춰 살짝 오르내림 */}
            <g className="hero-anim hero-walk">
              {/* 청바지 뒷주머니 */}
              <g fill="#7D82AD">
                <path d="M237 337 L248 337 L247.5 346 Q242.5 349 237.8 346 Z" />
                <path d="M256 337 L267 337 L266.2 346 Q261.5 349 256.5 346 Z" />
              </g>
              {/* 크림색 니트 */}
              <path d="M231 284 C231 275 237 271 245 270 L259 270 C267 271 273 275 273 284 L271.5 318 C271.5 326 272 332 272.5 339 L231.5 339 C232 332 232.5 326 232.5 318 Z" fill={SWEATER} />
              <rect x="231.3" y="333.5" width="41.4" height="5.8" rx="2.5" fill={SWEATER_RIB} />
              {/* 백팩 어깨끈 */}
              <path d="M236.5 271 L242 270 L241.5 290 L236 290 Z" fill="#D8667B" />
              <path d="M262 270 L267.5 271 L268 290 L262.5 290 Z" fill="#D8667B" />
              {/* 백팩 */}
              <rect x="233" y="279" width="38" height="51" rx="10" fill="#F08C9C" />
              <rect x="233" y="279" width="6" height="51" rx="3" fill="#E57A8D" opacity="0.7" />
              <rect x="238" y="306" width="28" height="21.5" rx="7" fill="#E57C90" />
              <path d="M240.5 311.5 Q252 307.5 263.5 311.5" fill="none" stroke="#CC5F76" strokeWidth="1.3" strokeLinecap="round" />
              {/* 가방에 단 작은 별 — '은별' */}
              <path d="M261.5 310.6 L261.5 314.6" stroke="#CC5F76" strokeWidth="0.9" />
              <path d="M261.5 314.2 L262.6 316.8 L265.3 317 L263.2 318.7 L263.9 321.4 L261.5 319.9 L259.1 321.4 L259.8 318.7 L257.7 317 L260.4 316.8 Z" fill="#FFE7A6" stroke="#E7B566" strokeWidth="0.5" strokeLinejoin="round" />

              {/* 긴 머리 */}
              <path d="M252 239 C243 239 237.5 246 237.5 255 C237.5 262 236 268 235 274 C233.6 283 233.6 293 234.4 301.5 C240 306 246 304.6 252 307 C258 304.6 264 306 269.6 301.5 C270.4 293 270.4 283 269 274 C268 268 266.5 262 266.5 255 C266.5 246 261 239 252 239 Z" fill="#4B3330" />
              <g fill="none" stroke="#3A2725" strokeWidth="1.1" strokeLinecap="round" opacity="0.55">
                <path d="M252 263 C251.6 276 251.2 290 250.8 303" />
                <path d="M243.5 263 C241.6 276 240.4 288 240.2 299" />
                <path d="M260.5 263 C262.4 276 263.6 288 263.8 299" />
              </g>
              <path d="M243.5 246.5 Q252 241.5 260.5 246.5" fill="none" stroke="#735249" strokeWidth="1.6" strokeLinecap="round" opacity="0.8" />
              {/* 노을빛 머리 테두리 */}
              <path d="M262 243 C265.5 246.5 266.6 251 266.5 256" fill="none" stroke="#F7C9A8" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
              {/* 리본 🎀 */}
              <path d="M252 257.5 L243.6 252.6 Q241.4 257.5 243.6 262.4 Z" fill="#F48DA0" />
              <path d="M252 257.5 L260.4 252.6 Q262.6 257.5 260.4 262.4 Z" fill="#F48DA0" />
              <circle cx="252" cy="257.5" r="2.3" fill="#E36E87" />

              {/* 바깥 팔 (자유롭게 흔들림) */}
              <g className="hero-anim hero-arm-free">
                <path d="M233.5 280 Q229.6 296 228.6 309 Q227.4 322 226.2 333" fill="none" stroke={SWEATER_SLEEVE} strokeWidth="9.6" strokeLinecap="round" />
                <path d="M226.6 328.6 L226.1 334" fill="none" stroke={SWEATER_RIB} strokeWidth="9.8" />
                <circle cx="226" cy="339.2" r="4.5" fill={SKIN_GIRL} />
              </g>
              {/* 아빠와 맞잡은 팔 */}
              <g className="hero-anim hero-arm-joined">
                <path d="M270.5 280 Q276.4 297 282.4 309 Q288.6 321.5 294.6 332" fill="none" stroke={SWEATER_SLEEVE} strokeWidth="9.6" strokeLinecap="round" />
                <path d="M292.2 327.6 L295 332.6" fill="none" stroke={SWEATER_RIB} strokeWidth="9.8" />
              </g>
            </g>
          </g>

          {/* ── 아빠: 조금 더 크고, 카디건 ───────────── */}
          <g className="hero-dad">
            {/* 안쪽 다리 */}
            <g className="hero-anim hero-leg hero-leg-b">
              <path d="M326 332 L350 332 L349.5 350 C348.6 382 347.6 410 347.2 437 L332 437 C331.2 410 329.4 380 326.8 352 C326 344 325.8 338 326 332 Z" fill="#4A4360" />
              <rect x="330.4" y="432" width="18" height="14" rx="5.5" fill="#5D4139" />
              <rect x="330.4" y="442" width="18" height="4" rx="2" fill="#3F2C27" />
            </g>
            {/* 바깥쪽 다리 */}
            <g className="hero-anim hero-leg hero-leg-a">
              <path d="M350 332 L374 332 C374.2 338 374 344 373.2 352 C370.6 380 368.8 410 368 437 L352.8 437 C352.4 410 351.4 382 350.5 350 Z" fill="#524A69" />
              <rect x="351.6" y="432" width="18" height="14" rx="5.5" fill="#5D4139" />
              <rect x="351.6" y="442" width="18" height="4" rx="2" fill="#3F2C27" />
            </g>

            <g className="hero-anim hero-walk">
              {/* 카디건 */}
              <path d="M319 270 C319 259 326 253.5 336 252 L364 252 C374 253.5 381 259 381 270 L377.5 314 C377 323 376.5 331 376 338.5 L324 338.5 C323.5 331 323 323 322.5 314 Z" fill={CARDIGAN} />
              <path d="M369.5 253 C376.5 255.5 381 261 381 270 L377.5 314 C377 323 376.5 331 376 338.5 L368.5 338.5 C370 314 370.8 284 369.5 253 Z" fill="#7B5E87" opacity="0.6" />
              <rect x="323.6" y="331" width="52.8" height="7.5" rx="3" fill={CARDIGAN_RIB} />
              {/* 셔츠 깃 + 카디건 목둘레 */}
              <path d="M338.5 249.5 C344 246 356 246 361.5 249.5 L361 253 C355 250.5 345 250.5 339 253 Z" fill="#FFF8EE" />
              <path d="M335.5 252 C341 257 359 257 364.5 252 L363 249.5 C357.5 253 342.5 253 337 249.5 Z" fill={CARDIGAN_RIB} />
              {/* 목, 귀 */}
              <rect x="342.5" y="236" width="15" height="14" rx="4" fill={SKIN_DAD} />
              <ellipse cx="335.4" cy="229.5" rx="3.3" ry="5.4" fill={SKIN_DAD} />
              <ellipse cx="364.6" cy="229.5" rx="3.3" ry="5.4" fill={SKIN_DAD} />
              {/* 짧은 머리 (살짝 희끗한 회갈색) */}
              <path d="M350 213 C340 213 334.5 220 334.5 229 C334.5 236 337 241.5 341 243.5 C344 244.6 356 244.6 359 243.5 C363 241.5 365.5 236 365.5 229 C365.5 220 360 213 350 213 Z" fill="#463D42" />
              <g fill="none" strokeLinecap="round">
                <path d="M343.5 218 Q350 214.8 356.5 218" stroke="#7A7075" strokeWidth="1.6" />
                {/* 노을빛 테두리 */}
                <path d="M341 216.5 C337 219.5 335 224 334.8 229" stroke="#F7C9A8" strokeWidth="1.2" opacity="0.7" />
              </g>

              {/* 바깥 팔 */}
              <g className="hero-anim hero-arm-free">
                <path d="M377.2 268 Q382.6 283 384.2 299 Q385.4 316 385.8 330" fill="none" stroke={CARDIGAN_SLEEVE} strokeWidth="12.5" strokeLinecap="round" />
                <path d="M385.7 324.6 L385.8 331" fill="none" stroke={CARDIGAN_RIB} strokeWidth="12.7" />
                <circle cx="385.9" cy="336.8" r="5.3" fill={SKIN_DAD} />
              </g>
              {/* 딸과 맞잡은 팔 */}
              <g className="hero-anim hero-arm-joined">
                <path d="M322.8 268 Q317 283 313.4 299 Q309.6 315.5 304.4 330" fill="none" stroke={CARDIGAN_SLEEVE} strokeWidth="12.5" strokeLinecap="round" />
                <path d="M306.3 324.8 L304.2 330.6" fill="none" stroke={CARDIGAN_RIB} strokeWidth="12.7" />
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
