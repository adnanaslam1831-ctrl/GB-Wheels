import "server-only";
import { getSupabase } from "@/lib/supabase/server";
import { modelCatalog } from "@/config/catalog";
import { num, one, type SP } from "@/lib/query";
import type { PublicVehicle, VehicleImage, VehicleWithImage } from "@/types/db";

export const PAGE_SIZE = 12;

export interface VehicleFilters {
  q?: string; brand?: string; model?: string; variant?: string;
  minPrice?: number; maxPrice?: number; minYear?: number; maxYear?: number;
  district?: string; fuel?: string; transmission?: string;
  minCc?: number; maxCc?: number; maxMileage?: number;
  condition?: string; registration?: string; customs?: string;
  sort: "newest" | "price_asc" | "price_desc";
  page: number;
}

export function parseFilters(sp: SP): VehicleFilters {
  const sort = one(sp.sort);
  return {
    q: one(sp.q), brand: one(sp.brand), model: one(sp.model), variant: one(sp.variant),
    minPrice: num(sp.minPrice), maxPrice: num(sp.maxPrice),
    minYear: num(sp.minYear), maxYear: num(sp.maxYear),
    district: one(sp.district), fuel: one(sp.fuel), transmission: one(sp.transmission),
    minCc: num(sp.minCc), maxCc: num(sp.maxCc), maxMileage: num(sp.maxMileage),
    condition: one(sp.condition), registration: one(sp.registration), customs: one(sp.customs),
    sort: sort === "price_asc" || sort === "price_desc" ? sort : "newest",
    page: Math.max(1, Math.floor(num(sp.page) ?? 1)),
  };
}

/** Strip characters that have meaning inside a PostgREST .or() filter or an ILIKE pattern. */
function clean(s: string) {
  return s.replace(/[,()%*_\\]/g, " ").trim();
}

async function attachCovers(vehicles: PublicVehicle[]): Promise<VehicleWithImage[]> {
  if (!vehicles.length) return [];
  const supabase = await getSupabase();
  if (!supabase) return vehicles.map((v) => ({ ...v, cover_url: null }));
  const { data } = await supabase
    .from("vehicle_images")
    .select("vehicle_id,url,is_cover,sort_order")
    .in("vehicle_id", vehicles.map((v) => v.id))
    .order("sort_order", { ascending: true });
  const covers = new Map<string, string>();
  (data ?? []).forEach((img: { vehicle_id: string; url: string; is_cover: boolean }) => {
    if (img.is_cover || !covers.has(img.vehicle_id)) covers.set(img.vehicle_id, img.url);
  });
  return vehicles.map((v) => ({ ...v, cover_url: covers.get(v.id) ?? null }));
}

export async function searchVehicles(f: VehicleFilters) {
  const supabase = await getSupabase();
  if (!supabase) return { vehicles: [] as VehicleWithImage[], total: 0, error: null as string | null };

  let q = supabase.from("public_vehicles").select("*", { count: "exact" }).in("status", ["active", "reserved"]);

  if (f.q) {
    const t = clean(f.q);
    if (t) q = q.or(`brand.ilike.%${t}%,model.ilike.%${t}%,variant.ilike.%${t}%,reference.ilike.%${t}%,town.ilike.%${t}%`);
  }
  if (f.brand) q = q.eq("brand", f.brand);
  if (f.model) q = q.eq("model", f.model);
  if (f.variant) q = q.ilike("variant", `%${clean(f.variant)}%`);
  if (f.minPrice != null) q = q.gte("advertised_price", f.minPrice);
  if (f.maxPrice != null) q = q.lte("advertised_price", f.maxPrice);
  if (f.minYear != null) q = q.gte("model_year", f.minYear);
  if (f.maxYear != null) q = q.lte("model_year", f.maxYear);
  if (f.district) q = q.eq("district", f.district);
  if (f.fuel) q = q.eq("fuel_type", f.fuel);
  if (f.transmission) q = q.eq("transmission", f.transmission);
  if (f.minCc != null) q = q.gte("engine_cc", f.minCc);
  if (f.maxCc != null) q = q.lte("engine_cc", f.maxCc);
  if (f.maxMileage != null) q = q.lte("mileage_km", f.maxMileage);
  if (f.condition) q = q.eq("condition", f.condition);
  if (f.registration) q = q.eq("registration_status", f.registration);
  if (f.customs) q = q.eq("customs_status", f.customs);

  if (f.sort === "price_asc") q = q.order("advertised_price", { ascending: true });
  else if (f.sort === "price_desc") q = q.order("advertised_price", { ascending: false });
  else q = q.order("created_at", { ascending: false });

  const from = (f.page - 1) * PAGE_SIZE;
  const { data, count, error } = await q.range(from, from + PAGE_SIZE - 1);
  if (error) return { vehicles: [], total: 0, error: error.message };
  return { vehicles: await attachCovers((data ?? []) as PublicVehicle[]), total: count ?? 0, error: null };
}

export async function getFeaturedVehicles(limit = 4) {
  const supabase = await getSupabase();
  if (!supabase) return [];
  const { data } = await supabase
    .from("public_vehicles").select("*").eq("status", "active").eq("is_featured", true)
    .order("created_at", { ascending: false }).limit(limit);
  return attachCovers((data ?? []) as PublicVehicle[]);
}

export async function getLatestVehicles(limit = 8) {
  const supabase = await getSupabase();
  if (!supabase) return [];
  const { data } = await supabase
    .from("public_vehicles").select("*").eq("status", "active")
    .order("created_at", { ascending: false }).limit(limit);
  return attachCovers((data ?? []) as PublicVehicle[]);
}

export async function getVehicleBySlug(slug: string) {
  const supabase = await getSupabase();
  if (!supabase) return null;
  const { data } = await supabase.from("public_vehicles").select("*").eq("slug", slug).maybeSingle();
  return (data as PublicVehicle | null) ?? null;
}

export async function getVehicleImages(vehicleId: string) {
  const supabase = await getSupabase();
  if (!supabase) return [];
  const { data } = await supabase
    .from("vehicle_images").select("*").eq("vehicle_id", vehicleId).order("sort_order", { ascending: true });
  return (data ?? []) as VehicleImage[];
}

export async function getSimilarVehicles(v: PublicVehicle, limit = 4) {
  const supabase = await getSupabase();
  if (!supabase) return [];
  const { data } = await supabase
    .from("public_vehicles").select("*").eq("status", "active").neq("id", v.id)
    .or(`brand.eq.${clean(v.brand)},district.eq.${clean(v.district)}`)
    .order("created_at", { ascending: false }).limit(limit);
  return attachCovers((data ?? []) as PublicVehicle[]);
}

/** Brand counts and brand->models map built from real active listings. */
export async function getFilterOptions() {
  const empty = { brandCounts: {} as Record<string, number>, districtCounts: {} as Record<string, number>, models: {} as Record<string, string[]> };
  const supabase = await getSupabase();
  if (!supabase) return empty;
  const { data } = await supabase
    .from("public_vehicles").select("brand,model,district").in("status", ["active", "reserved"]).limit(2000);
  const out = { ...empty, brandCounts: {}, districtCounts: {}, models: {} } as typeof empty;
  (data ?? []).forEach((r: { brand: string; model: string; district: string }) => {
    out.brandCounts[r.brand] = (out.brandCounts[r.brand] ?? 0) + 1;
    out.districtCounts[r.district] = (out.districtCounts[r.district] ?? 0) + 1;
    (out.models[r.brand] ??= []);
    if (!out.models[r.brand].includes(r.model)) out.models[r.brand].push(r.model);
  });
  Object.values(out.models).forEach((l) => l.sort());
  return out;
}

/** Models offered in dropdowns: real listings first, topped up with the reference catalogue. */
export function mergeModels(real: Record<string, string[]>) {
  const merged: Record<string, string[]> = {};
  const brands = new Set([...Object.keys(modelCatalog), ...Object.keys(real)]);
  brands.forEach((b) => {
    merged[b] = Array.from(new Set([...(real[b] ?? []), ...(modelCatalog[b] ?? [])])).sort();
  });
  return merged;
}

export async function getSavedIds(): Promise<Set<string>> {
  const supabase = await getSupabase();
  if (!supabase) return new Set();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return new Set();
  const { data } = await supabase.from("favorites").select("vehicle_id").eq("user_id", u.user.id);
  return new Set((data ?? []).map((r: { vehicle_id: string }) => r.vehicle_id));
}
