import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // STATIC_EXPORT=1 builds plain files into out/ (used for GitHub Pages); otherwise keep the template's standalone output.
  output: process.env.STATIC_EXPORT ? "export" : "standalone",
  // Sub-path hosting (e.g. /changun on GitHub Pages). Also read by src/components/sites/swadpia/data.ts.
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || undefined,
  images: { unoptimized: true },
};

export default nextConfig;
