import type { NextConfig } from "next";

const isTauriBuild = process.env.TAURI_ENV_PLATFORM !== undefined || process.env.npm_lifecycle_event === 'build:tauri';

const nextConfig: NextConfig = {
  output: isTauriBuild ? 'export' : 'standalone',
  assetPrefix: isTauriBuild ? './' : undefined,
  trailingSlash: isTauriBuild,
  transpilePackages: [
    'framer-motion',
    'lucide-react',
    'tailwind-merge',
    'clsx',
    'zustand',
    '@tauri-apps/api',
    '@tauri-apps/plugin-dialog',
    '@tauri-apps/plugin-updater',
    '@tauri-apps/plugin-process',
    'next-themes'
  ]
};

export default nextConfig;