'use client';

import type { SpendingMood } from '@/lib/spending-review';

/**
 * 지출 코치 캐릭터 "미쿠".
 * 외부 3D 에셋 없이 SVG + CSS 3D 트랜스폼(perspective/rotateY)으로
 * 좌우로 돌며 춤추는 모습을 만든다. 표정은 이번 달 지출 평가에 따라 바뀐다.
 */

const C = {
  hairLight: '#B5F0EC',
  hairBase: '#8CE0DC',
  hairShade: '#5FC6C2',
  hairLine: '#43ABA8',
  skin: '#FCE3CD',
  skinShade: '#F0C6A5',
  topLight: '#DCE2E7',
  topBase: '#C2CAD1',
  topShade: '#9BA5AD',
  teal: '#46C3C0',
  tealDark: '#2E9C9A',
  dark: '#3D4A52',
  darker: '#28323A',
  eye: '#18404F',
  iris: '#2FA5C4',
  pink: '#C43C79',
  blush: '#F4A9B8',
  lip: '#C4576B',
} as const;

/** 입 모양으로 감정을 표현 */
function Mouth({ mood }: { mood: SpendingMood }) {
  if (mood === 'great' || mood === 'good') {
    return (
      <path
        d="M121 125 C125 137 135 137 139 125 C134 129 126 129 121 125 Z"
        fill={C.lip}
      />
    );
  }
  if (mood === 'warning') {
    return (
      <path
        d="M123 133 Q130 126 137 133"
        stroke={C.lip}
        strokeWidth="2.6"
        strokeLinecap="round"
        fill="none"
      />
    );
  }
  if (mood === 'alert') {
    return (
      <path
        d="M121 131 q4.5 -5 9 0 q4.5 5 9 0"
        stroke={C.lip}
        strokeWidth="2.6"
        strokeLinecap="round"
        fill="none"
      />
    );
  }
  return (
    <path
      d="M123 127 Q130 134 137 127"
      stroke={C.lip}
      strokeWidth="2.6"
      strokeLinecap="round"
      fill="none"
    />
  );
}

export function DancingMascot({
  mood = 'normal',
  className = '',
}: {
  mood?: SpendingMood;
  className?: string;
}) {
  const flustered = mood === 'warning' || mood === 'alert';

  return (
    <div className={`mascot-stage ${className}`} aria-hidden="true">
      <svg
        viewBox="0 0 260 330"
        className="mascot-sway w-full h-full overflow-visible"
      >
        <defs>
          <linearGradient id="mascot-hair" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.hairLight} />
            <stop offset="100%" stopColor={C.hairBase} />
          </linearGradient>
          <linearGradient id="mascot-tail" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={C.hairBase} />
            <stop offset="100%" stopColor={C.hairShade} />
          </linearGradient>
          <linearGradient id="mascot-top" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={C.topLight} />
            <stop offset="100%" stopColor={C.topShade} />
          </linearGradient>
          <linearGradient id="mascot-skirt" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.dark} />
            <stop offset="100%" stopColor={C.darker} />
          </linearGradient>
          <radialGradient id="mascot-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={C.teal} stopOpacity="0.28" />
            <stop offset="100%" stopColor={C.teal} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* 무대 조명 */}
        <circle cx="130" cy="180" r="118" fill="url(#mascot-glow)" />

        {/* 음표 */}
        <g className="mascot-notes" fill={C.tealDark}>
          <text className="mascot-note mascot-note-1" x="52" y="212" fontSize="20">♪</text>
          <text className="mascot-note mascot-note-2" x="196" y="196" fontSize="17">♫</text>
          <text className="mascot-note mascot-note-3" x="72" y="150" fontSize="15">♪</text>
        </g>

        {/* 바닥 그림자 */}
        <ellipse className="mascot-shadow" cx="130" cy="308" rx="60" ry="10" fill={C.tealDark} />

        <g className="mascot-bob">
          {/* 트윈테일 (몸 뒤) */}
          <path
            className="mascot-tail-l"
            d="M96 60 C60 70 36 112 30 164 C24 212 32 248 48 268 C54 254 50 234 52 216 C60 240 76 250 88 246 C68 232 58 208 60 176 C62 138 78 100 100 82 Z"
            fill="url(#mascot-tail)"
          />
          <path
            className="mascot-tail-r"
            d="M164 60 C200 70 224 112 230 164 C236 212 228 248 212 268 C206 254 210 234 208 216 C200 240 184 250 172 246 C192 232 202 208 200 176 C198 138 182 100 160 82 Z"
            fill="url(#mascot-tail)"
          />

          {/* 다리 (니삭스) */}
          <g className="mascot-legs">
            <path d="M109 212 L128 212 L126 278 C126 284 111 284 111 278 Z" fill={C.dark} />
            <path d="M132 212 L151 212 L149 278 C149 284 134 284 134 278 Z" fill={C.dark} />
            <rect x="108" y="211" width="21" height="5" rx="2" fill={C.teal} />
            <rect x="131" y="211" width="21" height="5" rx="2" fill={C.teal} />
            {/* 부츠 */}
            <path d="M110 266 L127 266 L129 296 C129 300 126 302 120 302 L104 302 C100 302 99 298 102 294 Z" fill={C.darker} />
            <path d="M150 266 L133 266 L131 296 C131 300 134 302 140 302 L156 302 C160 302 161 298 158 294 Z" fill={C.darker} />
            <rect x="108" y="266" width="20" height="4" rx="2" fill={C.teal} />
            <rect x="132" y="266" width="20" height="4" rx="2" fill={C.teal} />
          </g>

          {/* 치마 */}
          <g className="mascot-skirt">
            <path d="M99 188 L161 188 L176 226 C150 234 110 234 84 226 Z" fill="url(#mascot-skirt)" />
            <g stroke={C.darker} strokeWidth="1.6" opacity="0.55">
              <path d="M113 190 L104 229" />
              <path d="M126 190 L122 233" />
              <path d="M140 190 L140 234" />
              <path d="M152 190 L159 231" />
            </g>
            <path d="M84 226 C110 234 150 234 176 226 L178 232 C150 240 110 240 82 232 Z" fill={C.teal} />
          </g>

          {/* 목 */}
          <rect x="121" y="124" width="18" height="20" rx="8" fill={C.skinShade} />

          {/* 상의 */}
          <path d="M104 148 C104 143 115 140 130 140 C145 140 156 143 156 148 L161 192 L99 192 Z" fill="url(#mascot-top)" />
          <path d="M113 142 L130 156 L147 142 L143 138 C137 136 123 136 117 138 Z" fill={C.teal} />
          {/* 넥타이 */}
          <path d="M130 154 L139 163 L135 202 L126 202 L121 163 Z" fill={C.teal} />
          <path d="M124 176 L136 176 L135.6 180 L123.6 180 Z" fill={C.tealDark} opacity="0.7" />
          <rect x="139" y="150" width="9" height="3.5" rx="1.5" fill="#D8E063" />

          {/* 팔 (탈착식 소매) */}
          <g className="mascot-arm-l">
            <path d="M104 144 C94 146 88 156 86 168 L100 172 C100 160 102 152 106 148 Z" fill={C.skin} />
            <path d="M86 164 C80 182 78 202 80 222 L102 224 C102 202 100 182 100 168 Z" fill={C.dark} />
            <path d="M80 212 L102 214 L102 219 L80 217 Z" fill={C.tealDark} />
            <rect x="84" y="186" width="14" height="2.4" rx="1.2" fill="#D8E063" opacity="0.8" />
            <circle cx="90" cy="230" r="9" fill={C.skin} />
          </g>
          <g className="mascot-arm-r">
            <path d="M156 144 C166 146 172 156 174 168 L160 172 C160 160 158 152 154 148 Z" fill={C.skin} />
            <path d="M174 164 C180 182 182 202 180 222 L158 224 C158 202 160 182 160 168 Z" fill={C.dark} />
            <path d="M180 212 L158 214 L158 219 L180 217 Z" fill={C.tealDark} />
            <rect x="162" y="186" width="14" height="2.4" rx="1.2" fill="#D8E063" opacity="0.8" />
            <circle cx="170" cy="230" r="9" fill={C.skin} />
          </g>

          {/* 머리 */}
          <g className="mascot-head">
            {/* 뒷머리 */}
            <ellipse cx="130" cy="90" rx="55" ry="52" fill={C.hairShade} />
            {/* 얼굴 */}
            <ellipse cx="130" cy="96" rx="47" ry="45" fill={C.skin} />

            {/* 표정 */}
            <g className="mascot-eyes">
              <g>
                <ellipse cx="112" cy="110" rx="11.5" ry="13.5" fill={C.eye} />
                <ellipse cx="112" cy="113" rx="8" ry="9" fill={C.iris} />
                <circle cx="108" cy="105" r="4.6" fill="#FFFFFF" />
                <circle cx="116" cy="118" r="2.2" fill="#FFFFFF" opacity="0.85" />
                <path d="M100 103 C104 95 120 95 124 103" stroke={C.eye} strokeWidth="4" strokeLinecap="round" fill="none" />
              </g>
              <g>
                <ellipse cx="148" cy="110" rx="11.5" ry="13.5" fill={C.eye} />
                <ellipse cx="148" cy="113" rx="8" ry="9" fill={C.iris} />
                <circle cx="144" cy="105" r="4.6" fill="#FFFFFF" />
                <circle cx="152" cy="118" r="2.2" fill="#FFFFFF" opacity="0.85" />
                <path d="M136 103 C140 95 156 95 160 103" stroke={C.eye} strokeWidth="4" strokeLinecap="round" fill="none" />
              </g>
            </g>
            <ellipse cx="95" cy="123" rx="9" ry="5" fill={C.blush} opacity="0.55" />
            <ellipse cx="165" cy="123" rx="9" ry="5" fill={C.blush} opacity="0.55" />
            <ellipse cx="130" cy="118" rx="1.6" ry="1.2" fill={C.skinShade} />
            <Mouth mood={mood} />

            {/* 앞머리 */}
            <path
              d="M82 106 C78 58 104 38 130 38 C156 38 182 58 178 106 C174 96 168 90 162 92 C156 94 152 98 148 102 C143 96 139 92 134 92 C128 92 123 97 118 100 C112 96 104 92 96 92 C89 92 84 100 82 106 Z"
              fill="url(#mascot-hair)"
            />
            {/* 앞머리 갈래 결 */}
            <g stroke={C.hairLine} strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.45">
              <path d="M130 40 C127 60 125 78 123 96" />
              <path d="M152 46 C152 66 150 84 147 99" />
              <path d="M108 46 C106 66 106 82 108 96" />
            </g>
            <path d="M86 98 C78 122 80 152 87 172 C93 154 95 126 95 106 Z" fill={C.hairBase} />
            <path d="M174 98 C182 122 180 152 173 172 C167 154 165 126 165 106 Z" fill={C.hairBase} />

            {/* 눈썹은 앞머리 위에 (애니풍) */}
            <path d="M102 96 C107 92 116 92 121 96" stroke="#35A5A2" strokeWidth="2.6" strokeLinecap="round" fill="none" />
            <path d="M139 96 C144 92 153 92 158 96" stroke="#35A5A2" strokeWidth="2.6" strokeLinecap="round" fill="none" />

            {/* 헤드셋 */}
            <g transform="rotate(-8 82 95)">
              <rect x="76" y="84" width="13" height="23" rx="5" fill={C.dark} />
              <rect x="79" y="89" width="7" height="4" rx="1" fill={C.teal} />
              <rect x="79" y="96" width="7" height="2.4" rx="1" fill="#D8E063" />
            </g>
            <path d="M84 108 C86 119 95 127 105 129" stroke={C.dark} strokeWidth="4" strokeLinecap="round" fill="none" />
            <circle cx="107" cy="129" r="3.6" fill={C.dark} />

            {/* 머리핀 */}
            <g transform="rotate(-30 88 60)">
              <rect x="68" y="50" width="36" height="11" rx="2.5" fill={C.dark} />
              <rect x="71" y="53" width="30" height="3" rx="1.5" fill={C.pink} />
            </g>
            <g transform="rotate(30 172 60)">
              <rect x="156" y="50" width="36" height="11" rx="2.5" fill={C.dark} />
              <rect x="159" y="53" width="30" height="3" rx="1.5" fill={C.pink} />
            </g>

            {/* 당황했을 때 땀방울 */}
            {flustered && (
              <path
                className="mascot-sweat"
                d="M194 74 C199 83 203 89 203 94 C203 99 199 103 194 103 C189 103 185 99 185 94 C185 89 189 83 194 74 Z"
                fill="#7FD8F5"
                opacity="0.9"
              />
            )}
          </g>
        </g>
      </svg>
    </div>
  );
}
