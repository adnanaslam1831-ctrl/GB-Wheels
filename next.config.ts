import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache Components / partial prefetching were enabled by the scaffold but are
  // intentionally off: this app is mostly per-user (auth) and filter-driven (DB) pages.
  images: {
    remotePatterns: [
      // Vercel Blob public store for vehicle photos
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
