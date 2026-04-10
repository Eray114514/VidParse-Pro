import type { NextConfig } from "next";

const isTauriBuild = process.env.TAURI_BUILD === 'true';

const nextConfig: NextConfig = {
  output: isTauriBuild ? 'export' : 'standalone',
  images: {
    unoptimized: isTauriBuild,
  },
  pageExtensions: isTauriBuild ? ['tsx', 'jsx'] : ['tsx', 'ts', 'jsx', 'js'],
};

export default nextConfig;
