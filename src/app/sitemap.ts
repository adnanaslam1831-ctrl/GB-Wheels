import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { safe, query } from "@/lib/db";
import { isDbConfigured } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url;
  const pages = ["", "/buy", "/sell", "/managed-sale", "/about", "/contact", "/privacy", "/terms"].map((p) => ({ url: `${base}${p}` }));
  // Only real, public vehicle pages. No empty brand/district pages.
  const data = isDbConfigured
    ? await safe(() => query<{ slug: string; created_at: string }>("select slug, created_at from public_vehicles where status = 'active' limit 5000"), [])
    : [];
  return [...pages, ...data.map((v) => ({ url: `${base}/cars/${v.slug}`, lastModified: v.created_at }))];
}
