import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // 종이·편지 느낌의 따뜻한 바탕 — 로즈(딸) 위에 '가족'의 온기를 더하는 보조색
        cream: {
          50: '#FFFBF5',
          100: '#FDF4E7',
          200: '#F8E6CC',
          300: '#F1D3A8',
        },
        // 노을빛 포인트 — 아빠의 목소리(쪽지·히어로)에 사용
        dusk: {
          300: '#F9B98A',
          400: '#F39A68',
          500: '#E77C4D',
        },
      },
      transitionTimingFunction: {
        soft: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      transitionDuration: {
        quick: '160ms',
        base: '320ms',
        slow: '600ms',
      },
    },
  },
  plugins: [],
};

export default config;
