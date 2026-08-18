import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-hosted on one box (see docs/DEPLOY.md). `standalone` traces the
  // server and only the node_modules it actually reaches into .next/standalone,
  // which is what the Dockerfile's runner stage copies.
  output: "standalone",
  images: {
    // Every photograph on the site is served from /public or a route handler —
    // no remote loaders.
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
