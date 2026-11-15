import './dash-motion.css';

/**
 * 빈 화면의 작은 새싹 — 은별이 소식을 기다리며 살랑거린다.
 * 미쿠가 없는 화면에서만 쓴다 (화면당 무한 루프는 하나).
 */
export function DashSprout({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {/* 흙 */}
      <ellipse cx="32" cy="54" rx="19" ry="5.5" fill="#F8E6CC" />
      <ellipse cx="32" cy="52.6" rx="12" ry="2.6" fill="#F1D3A8" />

      <g className="dash-sprout-sway">
        {/* 줄기 */}
        <path
          d="M32 52 C 32.4 45 31.2 39 32 30"
          fill="none"
          stroke="#34d399"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
        {/* 왼쪽 잎 */}
        <path d="M31.6 37 C 26 37.4 19.6 33.6 17.6 26.4 C 24.4 25 30.6 29.4 31.6 37 Z" fill="#6ee7b7" />
        <path
          d="M31 36 C 27 33.6 23.4 30.8 20.6 28"
          fill="none"
          stroke="#34d399"
          strokeWidth="1"
          strokeLinecap="round"
          opacity="0.7"
        />
        {/* 오른쪽 잎 */}
        <path d="M32.2 31 C 37.6 30.4 43.8 25.6 46 17.6 C 38.4 16.6 32.6 22.4 32.2 31 Z" fill="#34d399" />
        <path
          d="M32.8 30 C 36.4 26.8 40 23 43 19.6"
          fill="none"
          stroke="#10b981"
          strokeWidth="1"
          strokeLinecap="round"
          opacity="0.6"
        />
      </g>
    </svg>
  );
}
