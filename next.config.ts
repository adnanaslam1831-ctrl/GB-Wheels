import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache Components / partial prefetching were enabled by the scaffold but are
  // intentionally off: this app is mostly per-user (auth) and filter-driven (DB) pages.
  images: {
    remotePatterns: [
      // Supabase Storage public bucket for vehicle photos
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
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
