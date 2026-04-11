import type { NextConfig } from "next";

const isTauriBuild = process.env.TAURI_BUILD === 'true';

const nextConfig: NextConfig = {
  output: isTauriBuild ? 'export' : 'standalone',
  images: {
    unoptimized: isTauriBuild,
  },
  pageExtensions: isTauriBuild ? ['tsx', 'jsx'] : ['tsx', 'ts', 'jsx', 'js'],
  async headers() {
    if (isTauriBuild) return [];
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Cookie" },
        ]
      }
    ];
  },
};

export default nextConfig;
