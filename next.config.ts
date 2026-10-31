import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  devIndicators: false,
  turbopack: {
    rules: {
      "*.css": { loaders: ["@tailwindcss/turbopack"], type: "css" },
    },
  },
  cacheComponents: true,
  partialPrefetching: true,
};

export default nextConfig;
