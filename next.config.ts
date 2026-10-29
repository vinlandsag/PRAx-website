import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  experimental: {
    // Includes multipart overhead for the chat route's 25 MB per-file cap.
    proxyClientMaxBodySize: "26mb",
  },
  turbopack: {
    rules: {
      "*.css": { loaders: ["@tailwindcss/turbopack"], type: "css" },
    },
  },
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
};

export default nextConfig;
