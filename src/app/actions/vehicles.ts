"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSupabase } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { vehicleSchema, MAX_IMAGES } from "@/lib/validation/vehicle";
import { slugify } from "@/lib/utils";

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };

type Ctx =
  | { ok: false; error: string }
  | { ok: true; supabase: NonNullable<Awaited<ReturnType<typeof getSupabase>>>; user: { id: string; email?: string } };

async function ctx(): Promise<Ctx> {
  if (!isSupabaseConfigured) return { ok: false, error: "The database is not connected yet." };
  const supabase = (await getSupabase())!;
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { ok: false, error: "Please sign in again." };
  return { ok: true, supabase, user: data.user };
}

/**
 * Create or update the caller's own listing. All checks that matter are enforced by the
 * database too (RLS + guard trigger), so a tampered client cannot approve or feature a car.
 */
export async function saveVehicle(
  input: unknown,
  submit: boolean,
  existingId?: string,
): Promise<Result<{ id: string; slug: string }>> {
  const c = await ctx();
  if (!c.ok) return { ok: false, error: c.error };
  const { supabase, user } = c;

  const parsed = vehicleSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };
  const { contact_phone, ...v } = parsed.data;
  if (submit && v.selling_mode === "managed" && !contact_phone) {
    return { ok: false, error: "Enter a contact phone so GB Wheels can reach you about the managed sale." };
  }

  let id = existingId;
  let slug = "";

  if (id) {
    const { data: cur } = await supabase.from("vehicles").select("id,status,slug,selling_mode").eq("id", id).eq("seller_id", user.id).maybeSingle();
    if (!cur) return { ok: false, error: "Listing not found." };
    if (cur.status === "sold") return { ok: false, error: "A sold listing can no longer be edited." };
    const patch: Record<string, unknown> = { ...v, advertised_price: v.seller_asking_price };
    delete patch.selling_mode; // fixed after creation (also enforced by the database)
    if (cur.status === "draft" || cur.status === "rejected") patch.status = submit ? "pending" : "draft";
    const { error } = await supabase.from("vehicles").update(patch).eq("id", id);
    if (error) return { ok: false, error: error.message };
    slug = cur.slug;
  } else {
    slug = `${slugify(`${v.brand}-${v.model}-${v.model_year}-${v.district}`)}-${Math.random().toString(36).slice(2, 8)}`;
    const { data, error } = await supabase
      .from("vehicles")
      .insert({ ...v, advertised_price: v.seller_asking_price, seller_id: user.id, slug, status: submit ? "pending" : "draft" })
      .select("id")
      .single();
    if (error || !data) return { ok: false, error: error?.message ?? "Could not save the listing." };
    id = data.id;
  }

  // Managed sale: create the brokerage request once, when the listing is submitted.
  if (submit && v.selling_mode === "managed") {
    const { data: existing } = await supabase.from("managed_sales").select("id").eq("vehicle_id", id!).maybeSingle();
    if (!existing) {
      const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
      const { error } = await supabase.from("managed_sales").insert({
        vehicle_id: id, seller_id: user.id,
        contact_name: profile?.full_name || user.email || "Seller",
        contact_phone: contact_phone!,
        preferred_contact: "phone",
        vehicle_details: `${v.brand} ${v.model} ${v.variant ?? ""} ${v.model_year}`.replace(/\s+/g, " ").trim(),
        location: `${v.district}${v.town ? ", " + v.town : ""}`,
        description: v.description,
        seller_asking_price: v.seller_asking_price,
      });
      if (error) return { ok: false, error: `Listing saved, but the managed-sale request failed: ${error.message}` };
    }
  }

  revalidatePath("/dashboard/listings");
  return { ok: true, id: id!, slug };
}

const imageItem = z.object({
  path: z.string().min(5).max(300),
  url: z.string().url(),
  angle: z.string().max(40).nullable(),
});

export async function attachImages(vehicleId: string, items: unknown): Promise<Result> {
  const c = await ctx();
  if (!c.ok) return { ok: false, error: c.error };
  const { supabase, user } = c;
  const parsed = z.array(imageItem).min(1).max(MAX_IMAGES).safeParse(items);
  if (!parsed.success) return { ok: false, error: "Invalid image data." };

  const { data: veh } = await supabase.from("vehicles").select("id,brand,model,model_year").eq("id", vehicleId).eq("seller_id", user.id).maybeSingle();
  if (!veh) return { ok: false, error: "Listing not found." };
  // Files must live inside the caller's own folder for this vehicle (storage RLS enforces the user folder too).
  if (parsed.data.some((i) => !i.path.startsWith(`${user.id}/${vehicleId}/`))) return { ok: false, error: "Invalid image path." };

  const { count } = await supabase.from("vehicle_images").select("id", { count: "exact", head: true }).eq("vehicle_id", vehicleId);
  if ((count ?? 0) + parsed.data.length > MAX_IMAGES) return { ok: false, error: `A listing can have at most ${MAX_IMAGES} photos.` };

  const base = count ?? 0;
  const rows = parsed.data.map((i, n) => ({
    vehicle_id: vehicleId,
    storage_path: i.path,
    url: i.url,
    angle: i.angle,
    alt_text: `${veh.brand} ${veh.model} ${veh.model_year}${i.angle ? " - " + i.angle : ""}`,
    sort_order: base + n,
    is_cover: base + n === 0,
  }));
  const { error } = await supabase.from("vehicle_images").insert(rows);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function deleteImage(imageId: string): Promise<Result> {
  const c = await ctx();
  if (!c.ok) return { ok: false, error: c.error };
  const { supabase } = c;
  const { data: img } = await supabase.from("vehicle_images").select("id,vehicle_id,storage_path,is_cover").eq("id", imageId).maybeSingle();
  if (!img) return { ok: false, error: "Photo not found." };
  const { error } = await supabase.from("vehicle_images").delete().eq("id", imageId);
  if (error) return { ok: false, error: error.message };
  await supabase.storage.from("vehicle-images").remove([img.storage_path]);
  if (img.is_cover) {
    const { data: next } = await supabase.from("vehicle_images").select("id").eq("vehicle_id", img.vehicle_id).order("sort_order").limit(1).maybeSingle();
    if (next) await supabase.from("vehicle_images").update({ is_cover: true }).eq("id", next.id);
  }
  return { ok: true };
}

export async function deleteVehicle(vehicleId: string): Promise<Result> {
  const c = await ctx();
  if (!c.ok) return { ok: false, error: c.error };
  const { supabase, user } = c;
  const { data: imgs } = await supabase.from("vehicle_images").select("storage_path").eq("vehicle_id", vehicleId);
  const { error, count } = await supabase.from("vehicles").delete({ count: "exact" }).eq("id", vehicleId).eq("seller_id", user.id);
  if (error) return { ok: false, error: error.message };
  if (!count) return { ok: false, error: "Listing not found." };
  if (imgs?.length) await supabase.storage.from("vehicle-images").remove(imgs.map((i) => i.storage_path));
  revalidatePath("/dashboard/listings");
  return { ok: true };
}

/** Seller-allowed status changes. The database trigger rejects anything else. */
export async function setListingStatus(vehicleId: string, status: "pending" | "reserved" | "active" | "sold"): Promise<Result> {
  const c = await ctx();
  if (!c.ok) return { ok: false, error: c.error };
  const { supabase, user } = c;
  const { error, count } = await supabase.from("vehicles").update({ status }, { count: "exact" }).eq("id", vehicleId).eq("seller_id", user.id);
  if (error) return { ok: false, error: error.message };
  if (!count) return { ok: false, error: "Listing not found." };
  revalidatePath("/dashboard/listings");
  return { ok: true };
}
