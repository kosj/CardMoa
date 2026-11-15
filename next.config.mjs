/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      // 추억 사진 올리기: 큰 사진(WebP ≤ 3MB) + 썸네일(≤ 512KB)이 한 번에 오므로 기본 1MB에서 상향
      bodySizeLimit: '4mb',
    },
  },
};

export default nextConfig;
