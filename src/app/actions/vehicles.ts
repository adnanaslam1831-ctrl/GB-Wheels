"use server";

import { del } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { query, queryOne, tx } from "@/lib/db";
import { isDbConfigured } from "@/lib/env";
import { getSessionProfile } from "@/lib/session";
import { vehicleSchema, MAX_IMAGES } from "@/lib/validation/vehicle";
import { slugify } from "@/lib/utils";
import type { ListingStatus } from "@/types/db";

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };

async function actor() {
  if (!isDbConfigured) return { ok: false as const, error: "The database is not connected yet." };
  const user = await getSessionProfile();
  if (!user) return { ok: false as const, error: "Please sign in again." };
  return { ok: true as const, user };
}

// Columns a seller may set. Everything else (status flags, featured, verification, views) is staff-only.
const FIELDS = [
  "brand", "model", "variant", "model_year", "registration_year", "engine_cc", "color", "fuel_type", "transmission",
  "steering_side", "import_origin", "mileage_km", "condition", "engine_condition", "suspension_condition", "tyre_condition",
  "accident_history", "repainted_panels", "known_defects", "documents_available", "registration_status", "customs_status",
  "district", "town", "description",
] as const;

/**
 * Create or update the caller's own listing.
 * Rules enforced here (the only write path): owner-only edits; new listings start as draft/pending;
 * sellers can never approve, feature, verify or reprice a managed listing; editing a live listing sends it back for review.
 */
export async function saveVehicle(
  input: unknown,
  submit: boolean,
  existingId?: string,
): Promise<Result<{ id: string; slug: string }>> {
  const a = await actor();
  if (!a.ok) return a;
  const { user } = a;

  const parsed = vehicleSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };
  const v = parsed.data as Record<string, unknown> & { selling_mode: "standard" | "managed"; seller_asking_price: number; contact_phone: string | null };
  if (submit && v.selling_mode === "managed" && !v.contact_phone) {
    return { ok: false, error: "Enter a contact phone so GB Wheels can reach you about the managed sale." };
  }

  try {
    return await tx(async (c) => {
      let id = existingId;
      let slug = "";

      if (id) {
        const cur = (await c.query("select id, status, slug, selling_mode from vehicles where id = $1 and seller_id = $2 for update", [id, user.id])).rows[0];
        if (!cur) return { ok: false as const, error: "Listing not found." };
        if (cur.status === "sold") return { ok: false as const, error: "A sold listing can no longer be edited." };

        const cols: string[] = [...FIELDS];
        // Standard: price follows the seller. Managed: price is fixed once created (staff set the advertised price).
        if (cur.selling_mode === "standard") cols.push("seller_asking_price");
        const sets = cols.map((k, i) => `${k} = $${i + 1}`);
        const vals: unknown[] = cols.map((k) => v[k] ?? null);
        if (cur.selling_mode === "standard") sets.push(`advertised_price = $${cols.indexOf("seller_asking_price") + 1}`);

        let status: ListingStatus = cur.status;
        if (cur.status === "draft" || cur.status === "rejected") status = submit ? "pending" : "draft";
        else if (cur.status === "active") status = "pending"; // edits to a live listing go back for review
        sets.push(`status = $${vals.length + 1}`); vals.push(status);
        if (cur.status === "rejected") sets.push("rejection_reason = null");
        vals.push(id);
        await c.query(`update vehicles set ${sets.join(", ")} where id = $${vals.length}`, vals);
        slug = cur.slug;
      } else {
        slug = `${slugify(`${v.brand}-${v.model}-${v.model_year}-${v.district}`)}-${Math.random().toString(36).slice(2, 8)}`;
        const cols = [...FIELDS, "seller_asking_price", "advertised_price", "selling_mode", "seller_id", "slug", "status"];
        const vals: unknown[] = [...FIELDS.map((k) => v[k] ?? null), v.seller_asking_price, v.seller_asking_price, v.selling_mode, user.id, slug, submit ? "pending" : "draft"];
        const r = await c.query(`insert into vehicles (${cols.join(",")}) values (${vals.map((_, i) => `$${i + 1}`).join(",")}) returning id`, vals);
        id = r.rows[0].id as string;
      }

      // Managed sale: create the brokerage request once, when the listing is submitted.
      if (submit && v.selling_mode === "managed") {
        const has = await c.query("select 1 from managed_sales where vehicle_id = $1", [id]);
        if (!has.rowCount) {
          await c.query(
            `insert into managed_sales (vehicle_id, seller_id, contact_name, contact_phone, preferred_contact, vehicle_details, location, description, seller_asking_price)
             values ($1,$2,$3,$4,'phone',$5,$6,$7,$8)`,
            [id, user.id, user.full_name || user.email, v.contact_phone,
             `${v.brand} ${v.model} ${v.variant ?? ""} ${v.model_year}`.replace(/\s+/g, " ").trim(),
             `${v.district}${v.town ? ", " + v.town : ""}`, v.description ?? null, v.seller_asking_price],
          );
        }
      }
      return { ok: true as const, id: id!, slug };
    });
  } catch (e) {
    console.error("[saveVehicle]", (e as Error).message);
    return { ok: false, error: "Could not save the listing. Please try again." };
  }
}

const imageItem = z.object({ url: z.string().url().max(600), pathname: z.string().min(5).max(400), angle: z.string().max(40).nullable() });

/** Records photos that were uploaded straight to Vercel Blob. The path must be inside this seller's folder for this vehicle. */
export async function attachImages(vehicleId: string, items: unknown): Promise<Result> {
  const a = await actor();
  if (!a.ok) return a;
  const { user } = a;
  const parsed = z.array(imageItem).min(1).max(MAX_IMAGES).safeParse(items);
  if (!parsed.success || !z.string().uuid().safeParse(vehicleId).success) return { ok: false, error: "Invalid image data." };

  const prefix = `vehicles/${user.id}/${vehicleId}/`;
  for (const i of parsed.data) {
    let host = "";
    try { host = new URL(i.url).hostname; } catch { /* invalid */ }
    if (!host.endsWith(".public.blob.vercel-storage.com") || !i.pathname.startsWith(prefix)) return { ok: false, error: "Invalid image path." };
  }
  try {
    return await tx(async (c) => {
      const veh = (await c.query("select brand, model, model_year from vehicles where id = $1 and seller_id = $2 for update", [vehicleId, user.id])).rows[0];
      if (!veh) return { ok: false as const, error: "Listing not found." };
      const base = (await c.query("select count(*)::int as n from vehicle_images where vehicle_id = $1", [vehicleId])).rows[0].n as number;
      if (base + parsed.data.length > MAX_IMAGES) return { ok: false as const, error: `A listing can have at most ${MAX_IMAGES} photos.` };
      for (const [n, i] of parsed.data.entries()) {
        await c.query(
          `insert into vehicle_images (vehicle_id, storage_path, url, angle, alt_text, sort_order, is_cover) values ($1,$2,$3,$4,$5,$6,$7)`,
          [vehicleId, i.pathname, i.url, i.angle, `${veh.brand} ${veh.model} ${veh.model_year}${i.angle ? " - " + i.angle : ""}`, base + n, base + n === 0],
        );
      }
      return { ok: true as const };
    });
  } catch (e) {
    console.error("[attachImages]", (e as Error).message);
    return { ok: false, error: "Could not save the photos." };
  }
}

async function removeBlobs(urls: string[]) {
  if (!urls.length || !process.env.BLOB_READ_WRITE_TOKEN) return;
  await del(urls).catch((e) => console.error("[blob del]", (e as Error).message));
}

export async function deleteImage(imageId: string): Promise<Result> {
  const a = await actor();
  if (!a.ok) return a;
  if (!z.string().uuid().safeParse(imageId).success) return { ok: false, error: "Photo not found." };
  const img = await queryOne<{ id: string; vehicle_id: string; url: string; is_cover: boolean }>(
    `select i.id, i.vehicle_id, i.url, i.is_cover from vehicle_images i join vehicles v on v.id = i.vehicle_id
      where i.id = $1 and v.seller_id = $2`, [imageId, a.user.id]);
  if (!img) return { ok: false, error: "Photo not found." };
  await query("delete from vehicle_images where id = $1", [imageId]);
  if (img.is_cover) {
    await query(`update vehicle_images set is_cover = true where id = (select id from vehicle_images where vehicle_id = $1 order by sort_order limit 1)`, [img.vehicle_id]);
  }
  await removeBlobs([img.url]);
  return { ok: true };
}

export async function deleteVehicle(vehicleId: string): Promise<Result> {
  const a = await actor();
  if (!a.ok) return a;
  if (!z.string().uuid().safeParse(vehicleId).success) return { ok: false, error: "Listing not found." };
  const imgs = await query<{ url: string }>(
    "select i.url from vehicle_images i join vehicles v on v.id = i.vehicle_id where v.id = $1 and v.seller_id = $2", [vehicleId, a.user.id]);
  const del_ = await query("delete from vehicles where id = $1 and seller_id = $2 returning id", [vehicleId, a.user.id]);
  if (!del_.length) return { ok: false, error: "Listing not found." };
  await removeBlobs(imgs.map((i) => i.url));
  revalidatePath("/dashboard/listings");
  return { ok: true };
}

// Seller-allowed status changes; anything else is refused.
const ALLOWED: Record<string, string[]> = {
  draft: ["pending"], rejected: ["pending", "draft"], active: ["reserved", "sold"], reserved: ["active", "sold"],
};

export async function setListingStatus(vehicleId: string, status: "pending" | "reserved" | "active" | "sold"): Promise<Result> {
  const a = await actor();
  if (!a.ok) return a;
  if (!z.string().uuid().safeParse(vehicleId).success) return { ok: false, error: "Listing not found." };
  const cur = await queryOne<{ status: string; selling_mode: string; photos: number }>(
    "select status, selling_mode, (select count(*)::int from vehicle_images where vehicle_id = vehicles.id) as photos from vehicles where id = $1 and seller_id = $2",
    [vehicleId, a.user.id]);
  if (!cur) return { ok: false, error: "Listing not found." };
  if (!(ALLOWED[cur.status] ?? []).includes(status)) return { ok: false, error: `Status change from ${cur.status} to ${status} is not allowed.` };
  if (status === "pending" && cur.selling_mode === "standard" && cur.photos < 1) return { ok: false, error: "Add at least one photo before submitting." };
  await query("update vehicles set status = $1, rejection_reason = case when $3::boolean then null else rejection_reason end where id = $2", [status, vehicleId, status === "pending"]);
  revalidatePath("/dashboard/listings");
  return { ok: true };
}
