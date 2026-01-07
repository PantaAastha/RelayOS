import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Required for Docker builds with Next.js 16 Turbopack
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
