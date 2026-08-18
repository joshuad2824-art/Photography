import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Every photograph on the site is served from /public — no remote loaders.
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
