import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { getSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url;
  const pages = ["", "/buy", "/sell", "/managed-sale", "/about", "/contact", "/privacy", "/terms"].map((p) => ({ url: `${base}${p}` }));
  // Only real, public vehicle pages. No empty brand/district pages.
  const supabase = await getSupabase();
  const { data } = supabase ? await supabase.from("public_vehicles").select("slug,created_at").eq("status", "active").limit(5000) : { data: [] };
  return [...pages, ...(data ?? []).map((v) => ({ url: `${base}/cars/${v.slug}`, lastModified: v.created_at }))];
}
