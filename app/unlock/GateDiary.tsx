/**
 * 잠금 화면의 작은 그림: 자물쇠가 달린 은별이의 노트(다이어리).
 * 처음 한 번만 노트가 내려앉고 자물쇠가 살랑 흔들린다 (unlock.css).
 * 장식용이므로 aria-hidden.
 */
export function GateDiary({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 160 128"
      className={`gate-diary block ${className}`}
      aria-hidden="true"
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="gate-cover" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F9B98A" />
          <stop offset="0.55" stopColor="#F59FA6" />
          <stop offset="1" stopColor="#EE8B9C" />
        </linearGradient>
        <linearGradient id="gate-lock" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFEBC2" />
          <stop offset="1" stopColor="#FBD08E" />
        </linearGradient>
      </defs>

      {/* 바닥 그림자 */}
      <ellipse className="gate-diary-shadow" cx="78" cy="117" rx="48" ry="4.5" fill="#E77C4D" opacity="0.16" />

      <g className="gate-anim gate-diary-body">
        {/* 종이 묶음 (표지 뒤로 살짝 보이는 페이지) */}
        <rect x="38" y="16" width="86" height="96" rx="9" fill="#FFFBF5" stroke="#F1D3A8" strokeWidth="1.5" />
        <g stroke="#F1D3A8" strokeWidth="1" strokeLinecap="round" opacity="0.9">
          <path d="M122 26 L122 102" />
          <path d="M119 109 L46 109" />
        </g>

        {/* 표지 */}
        <rect x="30" y="10" width="88" height="96" rx="10" fill="url(#gate-cover)" />
        {/* 책등 */}
        <path d="M40 10 L40 106 L36 106 Q30 106 30 100 L30 16 Q30 10 36 10 Z" fill="#E77C4D" opacity="0.28" />
        <path d="M44.5 18 L44.5 98" stroke="#FFFBF5" strokeWidth="1.2" strokeDasharray="3 3.4" strokeLinecap="round" opacity="0.7" />

        {/* 표지 이름표: 별 하나 = 은별 */}
        <rect x="54" y="28" width="46" height="26" rx="7" fill="#FFFBF5" opacity="0.94" />
        <path
          d="M66 34.2 L67.7 38.2 L72 38.5 L68.7 41.3 L69.8 45.5 L66 43.2 L62.2 45.5 L63.3 41.3 L60 38.5 L64.3 38.2 Z"
          fill="#FFE7A6"
          stroke="#E7B566"
          strokeWidth="0.9"
          strokeLinejoin="round"
        />
        <g stroke="#F3B3A4" strokeWidth="2" strokeLinecap="round">
          <path d="M76 38.5 L92 38.5" />
          <path d="M76 44.5 L87 44.5" />
        </g>

        {/* 표지 아래 작은 하트 */}
        <path
          d="M74 88 C69.6 85 68 82.7 68 80.7 C68 78.8 69.4 77.6 71.1 77.6 C72.4 77.6 73.4 78.3 74 79.3 C74.6 78.3 75.6 77.6 76.9 77.6 C78.6 77.6 80 78.8 80 80.7 C80 82.7 78.4 85 74 88 Z"
          fill="#FFFBF5"
          opacity="0.75"
        />

        {/* 잠금 끈: 뒤에서 오른쪽 모서리를 감싸 앞으로 */}
        <path d="M117 58 L124 58 Q128 58 128 62 L128 72 Q128 76 124 76 L117 76 Z" fill="#D96F45" />
        <path d="M95 67 Q95 58 104 58 L118 58 L118 76 L104 76 Q95 76 95 67 Z" fill="#EF8A5C" />
        <path d="M100 60.6 Q97.6 62.4 97.4 66" fill="none" stroke="#FFFFFF" strokeWidth="1.1" strokeLinecap="round" opacity="0.45" />
        <circle cx="101.6" cy="67" r="1.8" fill="#FFE2C4" />

        {/* 자물쇠 — 끈에 매달려 살랑 */}
        <g className="gate-anim gate-lock">
          <path
            d="M106 76 L106 70.5 C106 64.5 110 61 114.5 61 C119 61 123 64.5 123 70.5 L123 76"
            fill="none"
            stroke="#D9A55B"
            strokeWidth="3.6"
            strokeLinecap="round"
          />
          <rect x="102.5" y="74" width="24" height="21" rx="6.5" fill="url(#gate-lock)" stroke="#E2AE62" strokeWidth="1.3" />
          <path
            d="M114.5 89.4 C110.9 87 109.6 85.1 109.6 83.4 C109.6 81.9 110.8 80.8 112.2 80.8 C113.2 80.8 114 81.4 114.5 82.2 C115 81.4 115.8 80.8 116.8 80.8 C118.2 80.8 119.4 81.9 119.4 83.4 C119.4 85.1 118.1 87 114.5 89.4 Z"
            fill="#E36E87"
          />
          <rect x="105" y="76.4" width="5" height="1.6" rx="0.8" fill="#FFFFFF" opacity="0.7" />
        </g>
      </g>

      {/* 반짝임 — 처음 한 번만 */}
      <g fill="#F9B98A">
        <path className="gate-anim gate-twinkle" d="M136 22 L137.6 26.4 L142 28 L137.6 29.6 L136 34 L134.4 29.6 L130 28 L134.4 26.4 Z" />
        <path
          className="gate-anim gate-twinkle gate-twinkle-late"
          d="M20 46 L21 48.8 L23.8 49.8 L21 50.8 L20 53.6 L19 50.8 L16.2 49.8 L19 48.8 Z"
          fill="#F7A3B5"
        />
        <circle className="gate-anim gate-twinkle gate-twinkle-late" cx="140" cy="48" r="2" fill="#FBC3CE" />
      </g>
    </svg>
  );
}
