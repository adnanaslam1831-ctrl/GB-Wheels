import "server-only";
import { query, safe } from "@/lib/db";
import { isDbConfigured } from "@/lib/env";
import { getSessionProfile } from "@/lib/session";
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

/** Escape LIKE wildcards so user text is matched literally. */
const like = (s: string) => `%${s.replace(/[\\%_]/g, "\\$&")}%`;

async function attachCovers(vehicles: PublicVehicle[]): Promise<VehicleWithImage[]> {
  if (!vehicles.length) return [];
  const rows = await safe(
    () =>
      query<{ vehicle_id: string; url: string }>(
        `select distinct on (vehicle_id) vehicle_id, url from vehicle_images
          where vehicle_id = any($1::uuid[]) order by vehicle_id, is_cover desc, sort_order asc`,
        [vehicles.map((v) => v.id)],
      ),
    [],
  );
  const covers = new Map(rows.map((r) => [r.vehicle_id, r.url]));
  return vehicles.map((v) => ({ ...v, cover_url: covers.get(v.id) ?? null }));
}

export async function searchVehicles(f: VehicleFilters) {
  if (!isDbConfigured) return { vehicles: [] as VehicleWithImage[], total: 0, error: null as string | null };
  try {
    const where: string[] = ["status in ('active','reserved')"];
    const p: unknown[] = [];
    const add = (sql: string, v: unknown) => { p.push(v); where.push(sql.replace("$#", `$${p.length}`)); };

    if (f.q) add("(brand ilike $# or model ilike $# or coalesce(variant,'') ilike $# or reference ilike $# or coalesce(town,'') ilike $#)", like(f.q));
    if (f.brand) add("brand = $#", f.brand);
    if (f.model) add("model = $#", f.model);
    if (f.variant) add("coalesce(variant,'') ilike $#", like(f.variant));
    if (f.minPrice != null) add("advertised_price >= $#", f.minPrice);
    if (f.maxPrice != null) add("advertised_price <= $#", f.maxPrice);
    if (f.minYear != null) add("model_year >= $#", f.minYear);
    if (f.maxYear != null) add("model_year <= $#", f.maxYear);
    if (f.district) add("district = $#", f.district);
    if (f.fuel) add("fuel_type = $#", f.fuel);
    if (f.transmission) add("transmission = $#", f.transmission);
    if (f.minCc != null) add("engine_cc >= $#", f.minCc);
    if (f.maxCc != null) add("engine_cc <= $#", f.maxCc);
    if (f.maxMileage != null) add("mileage_km <= $#", f.maxMileage);
    if (f.condition) add("condition = $#", f.condition);
    if (f.registration) add("registration_status::text = $#", f.registration);
    if (f.customs) add("customs_status::text = $#", f.customs);

    const order = f.sort === "price_asc" ? "advertised_price asc, id" : f.sort === "price_desc" ? "advertised_price desc, id" : "created_at desc, id";
    const w = where.join(" and ");
    const [{ n }] = await query<{ n: number }>(`select count(*)::int as n from public_vehicles where ${w}`, p);
    const rows = await query<PublicVehicle>(
      `select * from public_vehicles where ${w} order by ${order} limit ${PAGE_SIZE} offset ${(f.page - 1) * PAGE_SIZE}`,
      p,
    );
    return { vehicles: await attachCovers(rows), total: n, error: null };
  } catch (e) {
    console.error("[search]", (e as Error).message);
    return { vehicles: [] as VehicleWithImage[], total: 0, error: "query failed" };
  }
}

async function list(sql: string, params: unknown[]) {
  if (!isDbConfigured) return [];
  const rows = await safe(() => query<PublicVehicle>(sql, params), []);
  return attachCovers(rows);
}

export const getFeaturedVehicles = (limit = 4) =>
  list("select * from public_vehicles where status = 'active' and is_featured order by created_at desc limit $1", [limit]);

export const getLatestVehicles = (limit = 8) =>
  list("select * from public_vehicles where status = 'active' order by created_at desc limit $1", [limit]);

export async function getVehicleBySlug(slug: string) {
  if (!isDbConfigured) return null;
  const rows = await safe(() => query<PublicVehicle>("select * from public_vehicles where slug = $1", [slug]), []);
  return rows[0] ?? null;
}

export async function getVehicleImages(vehicleId: string) {
  if (!isDbConfigured) return [];
  return safe(() => query<VehicleImage>("select * from vehicle_images where vehicle_id = $1 order by sort_order asc", [vehicleId]), []);
}

export const getSimilarVehicles = (v: PublicVehicle, limit = 4) =>
  list(
    "select * from public_vehicles where status = 'active' and id <> $1 and (brand = $2 or district = $3) order by created_at desc limit $4",
    [v.id, v.brand, v.district, limit],
  );

/** Brand counts and brand->models map built from real active listings. */
export async function getFilterOptions() {
  const out = { brandCounts: {} as Record<string, number>, districtCounts: {} as Record<string, number>, models: {} as Record<string, string[]> };
  if (!isDbConfigured) return out;
  const rows = await safe(
    () => query<{ brand: string; model: string; district: string }>("select brand, model, district from public_vehicles where status in ('active','reserved') limit 2000"),
    [],
  );
  rows.forEach((r) => {
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
  new Set([...Object.keys(modelCatalog), ...Object.keys(real)]).forEach((b) => {
    merged[b] = Array.from(new Set([...(real[b] ?? []), ...(modelCatalog[b] ?? [])])).sort();
  });
  return merged;
}

export async function getSavedIds(): Promise<Set<string>> {
  const user = await getSessionProfile();
  if (!user) return new Set();
  const rows = await safe(() => query<{ vehicle_id: string }>("select vehicle_id from favorites where user_id = $1", [user.id]), []);
  return new Set(rows.map((r) => r.vehicle_id));
}
