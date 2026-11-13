import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // STATIC_EXPORT=1 → out/ 에 정적 파일 생성 (GitHub Pages 배포용). 아니면 기본 standalone 출력.
  output: process.env.STATIC_EXPORT ? "export" : "standalone",
  // 하위 경로 배포 (예: https://<user>.github.io/changun)
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || undefined,
  trailingSlash: !!process.env.STATIC_EXPORT,
  images: { unoptimized: true },
};

export default nextConfig;
