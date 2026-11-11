"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertRole } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase/server";
import type { UserRole } from "@/types/db";

const LISTING: UserRole[] = ["super_admin", "listing_manager"];
const SALES: UserRole[] = ["super_admin", "listing_manager", "sales_agent"];
const MONEY: UserRole[] = ["super_admin", "sales_agent"];
const SUPER: UserRole[] = ["super_admin"];

async function db(roles: UserRole[]) {
  const actor = await assertRole(roles); // server-side check on every call
  const supabase = await getSupabase();
  if (!supabase) throw new Error("Database not configured.");
  const log = async (action: string, entity_type: string, entity_id: string, metadata?: object) => {
    await supabase.from("activity_logs").insert({ actor_id: actor.id, action, entity_type, entity_id, metadata: metadata ?? null });
  };
  return { supabase, actor, log };
}

const uuid = z.string().uuid();
const must = (error: { message: string } | null) => { if (error) throw new Error(error.message); };

// ---------- listings ----------
export async function setVehicleStatus(fd: FormData) {
  const { supabase, log } = await db(LISTING);
  const id = uuid.parse(fd.get("id"));
  const status = z.enum(["active", "rejected", "pending", "expired", "reserved", "sold"]).parse(fd.get("status"));
  const reason = String(fd.get("reason") ?? "").trim().slice(0, 500) || null;
  if (status === "rejected" && !reason) throw new Error("Give a reason when rejecting a listing.");
  const patch: Record<string, unknown> = { status, rejection_reason: status === "rejected" ? reason : null };
  if (status === "active") patch.published_at = new Date().toISOString();
  must((await supabase.from("vehicles").update(patch).eq("id", id)).error);
  await log(`vehicle.${status}`, "vehicle", id, { reason });
  revalidatePath("/admin/cars"); revalidatePath("/admin");
}

export async function toggleFeatured(fd: FormData) {
  const { supabase, log } = await db(LISTING);
  const id = uuid.parse(fd.get("id"));
  const on = fd.get("on") === "true";
  must((await supabase.from("vehicles").update({ is_featured: on }).eq("id", id)).error);
  await log(on ? "vehicle.featured" : "vehicle.unfeatured", "vehicle", id);
  revalidatePath("/admin/featured"); revalidatePath("/admin/cars");
}

/** Verification flags: set only after the check has genuinely happened. */
export async function setVerification(fd: FormData) {
  const { supabase, log } = await db(LISTING);
  const id = uuid.parse(fd.get("id"));
  const patch = {
    docs_reviewed: fd.get("docs_reviewed") === "on",
    gbw_inspected: fd.get("gbw_inspected") === "on",
    independently_verified: fd.get("independently_verified") === "on",
  };
  must((await supabase.from("vehicles").update(patch).eq("id", id)).error);
  await log("vehicle.verification", "vehicle", id, patch);
  revalidatePath("/admin/cars");
}

export async function adminDeleteVehicle(fd: FormData) {
  const { supabase, log } = await db(LISTING);
  const id = uuid.parse(fd.get("id"));
  const { data: imgs } = await supabase.from("vehicle_images").select("storage_path").eq("vehicle_id", id);
  must((await supabase.from("vehicles").delete().eq("id", id)).error);
  if (imgs?.length) await supabase.storage.from("vehicle-images").remove(imgs.map((i) => i.storage_path));
  await log("vehicle.deleted", "vehicle", id);
  revalidatePath("/admin/cars");
}

export async function setReportStatus(fd: FormData) {
  const { supabase, actor, log } = await db(LISTING);
  const id = uuid.parse(fd.get("id"));
  const status = z.enum(["open", "reviewing", "resolved", "dismissed"]).parse(fd.get("status"));
  must((await supabase.from("reports").update({ status, resolved_by: status === "resolved" || status === "dismissed" ? actor.id : null }).eq("id", id)).error);
  await log(`report.${status}`, "report", id);
  revalidatePath("/admin/reports");
}

// ---------- users ----------
export async function updateUser(fd: FormData) {
  const { supabase, actor, log } = await db(SUPER);
  const id = uuid.parse(fd.get("id"));
  const role = z.enum(["user", "super_admin", "listing_manager", "sales_agent", "photographer"]).parse(fd.get("role"));
  const is_active = fd.get("is_active") === "on";
  if (id === actor.id && (role !== "super_admin" || !is_active)) throw new Error("You can't remove your own Super Admin access.");
  must((await supabase.from("profiles").update({ role, is_active }).eq("id", id)).error);
  await log("user.updated", "profile", id, { role, is_active });
  revalidatePath("/admin/users");
}

// ---------- inquiries ----------
export async function updateInquiry(fd: FormData) {
  const { supabase, log } = await db(SALES);
  const id = uuid.parse(fd.get("id"));
  const status = z.enum(["new", "buyer_contacted", "seller_contacted", "viewing_arranged", "negotiation", "deal_confirmed", "completed", "unsuccessful"]).parse(fd.get("status"));
  const notes = String(fd.get("notes") ?? "").trim().slice(0, 4000) || null;
  const assigned = String(fd.get("assigned_to") ?? "");
  must((await supabase.from("inquiries").update({ status, notes, assigned_to: assigned ? uuid.parse(assigned) : null }).eq("id", id)).error);
  await log("inquiry.updated", "inquiry", id, { status });
  revalidatePath("/admin/inquiries");
}

// ---------- brokerage rules ----------
const ruleSchema = z.object({
  name: z.string().trim().min(2).max(100),
  type: z.enum(["fixed", "percentage", "tiered", "custom", "zero"]),
  fixed_amount: z.string().optional(), percentage: z.string().optional(), tiers: z.string().optional(),
});

export async function saveRule(fd: FormData) {
  const { supabase, log } = await db(SUPER);
  const p = ruleSchema.parse(Object.fromEntries(fd));
  const row: Record<string, unknown> = { name: p.name, type: p.type, fixed_amount: null, percentage: null, tiers: null };
  if (p.type === "fixed") {
    const n = Number(p.fixed_amount); if (!Number.isInteger(n) || n < 0) throw new Error("Enter a valid fixed amount.");
    row.fixed_amount = n;
  } else if (p.type === "percentage") {
    const n = Number(p.percentage); if (!(n >= 0 && n <= 100)) throw new Error("Percentage must be 0 to 100.");
    row.percentage = n;
  } else if (p.type === "tiered") {
    let t: unknown;
    try { t = JSON.parse(p.tiers ?? ""); } catch { throw new Error('Tiers must be JSON, e.g. [{"up_to":1000000,"amount":30000},{"up_to":null,"amount":60000}]'); }
    const ok = z.array(z.object({ up_to: z.number().positive().nullable(), amount: z.number().int().min(0) })).min(1).safeParse(t);
    if (!ok.success) throw new Error("Invalid tiers JSON.");
    row.tiers = ok.data;
  }
  const id = String(fd.get("id") ?? "");
  const res = id ? await supabase.from("brokerage_rules").update(row).eq("id", uuid.parse(id)) : await supabase.from("brokerage_rules").insert(row);
  must(res.error);
  await log("brokerage_rule.saved", "brokerage_rule", id || "00000000-0000-0000-0000-000000000000", { name: p.name, type: p.type });
  revalidatePath("/admin/brokerage");
}

export async function setDefaultRule(fd: FormData) {
  const { supabase, log } = await db(SUPER);
  const id = uuid.parse(fd.get("id"));
  must((await supabase.from("brokerage_rules").update({ is_default: false }).eq("is_default", true)).error);
  must((await supabase.from("brokerage_rules").update({ is_default: true, is_active: true }).eq("id", id)).error);
  await log("brokerage_rule.default", "brokerage_rule", id);
  revalidatePath("/admin/brokerage");
}

export async function toggleRule(fd: FormData) {
  const { supabase, log } = await db(SUPER);
  const id = uuid.parse(fd.get("id"));
  must((await supabase.from("brokerage_rules").update({ is_active: fd.get("on") === "true" }).eq("id", id)).error);
  await log("brokerage_rule.toggled", "brokerage_rule", id);
  revalidatePath("/admin/brokerage");
}

// ---------- managed sales ----------
/** Price is computed in Postgres (calculate_brokerage); the browser only picks a rule. */
export async function applyPricing(fd: FormData) {
  const { supabase } = await db(SALES);
  const id = uuid.parse(fd.get("id"));
  const rule = uuid.parse(fd.get("rule"));
  const raw = String(fd.get("custom") ?? "").replace(/[,\s]/g, "");
  const custom = raw === "" ? null : Number(raw);
  if (custom !== null && (!Number.isInteger(custom) || custom < 0)) throw new Error("Invalid custom amount.");
  must((await supabase.rpc("set_managed_sale_pricing", { p_managed_sale: id, p_rule: rule, p_custom_amount: custom })).error);
  revalidatePath("/admin/managed");
}

export async function updateManagedSale(fd: FormData) {
  const { supabase, log } = await db(SALES);
  const id = uuid.parse(fd.get("id"));
  const status = z.enum(["requested", "agreed", "listed", "negotiating", "cancelled"]).parse(fd.get("status"));
  const notes = String(fd.get("notes") ?? "").trim().slice(0, 4000) || null;
  const { data: ms } = await supabase.from("managed_sales").select("vehicle_id,advertised_price,seller_agreed").eq("id", id).single();
  if (!ms) throw new Error("Managed sale not found.");
  // 'listed' also publishes the linked vehicle at the agreed advertised price.
  if (status === "listed") {
    if (!ms.seller_agreed || !ms.advertised_price) throw new Error("The seller must agree to the pricing before the car is listed.");
    if (ms.vehicle_id) {
      must((await supabase.from("vehicles").update({ advertised_price: ms.advertised_price }).eq("id", ms.vehicle_id)).error);
    }
  }
  must((await supabase.from("managed_sales").update({ deal_status: status, notes }).eq("id", id)).error);
  await log("managed_sale.updated", "managed_sale", id, { status });
  revalidatePath("/admin/managed");
}

/** Revenue is recorded only here, when staff confirm the sale actually completed. */
export async function completeManagedSale(fd: FormData) {
  const { supabase, actor, log } = await db(MONEY);
  const id = uuid.parse(fd.get("id"));
  const price = Number(String(fd.get("final_price") ?? "").replace(/[,\s]/g, ""));
  if (!Number.isInteger(price) || price <= 0) throw new Error("Enter the final selling price.");
  const { data: ms } = await supabase.from("managed_sales").select("*").eq("id", id).single();
  if (!ms) throw new Error("Managed sale not found.");
  if (!ms.seller_agreed) throw new Error("The seller never agreed to the brokerage terms.");
  if (ms.deal_status === "completed") throw new Error("Already completed.");

  must((await supabase.from("managed_sales").update({ final_selling_price: price, deal_status: "completed" }).eq("id", id)).error);
  must((await supabase.from("transactions").insert({
    vehicle_id: ms.vehicle_id, managed_sale_id: id,
    seller_amount: ms.seller_asking_price, brokerage_amount: ms.brokerage_amount ?? 0,
    final_selling_price: price, status: "completed", completed_at: new Date().toISOString(), created_by: actor.id,
  })).error);
  if (ms.vehicle_id) await supabase.from("vehicles").update({ status: "sold" }).eq("id", ms.vehicle_id);
  await log("managed_sale.completed", "managed_sale", id, { price });
  revalidatePath("/admin/managed"); revalidatePath("/admin/transactions"); revalidatePath("/admin");
}

// ---------- transactions ----------
export async function setTransactionStatus(fd: FormData) {
  const { supabase, log } = await db(MONEY);
  const id = uuid.parse(fd.get("id"));
  const status = z.enum(["pending", "completed", "cancelled"]).parse(fd.get("status"));
  must((await supabase.from("transactions").update({ status, completed_at: status === "completed" ? new Date().toISOString() : null }).eq("id", id)).error);
  await log(`transaction.${status}`, "transaction", id);
  revalidatePath("/admin/transactions"); revalidatePath("/admin");
}

export async function createTransaction(fd: FormData) {
  const { supabase, actor, log } = await db(MONEY);
  const n = (k: string) => Number(String(fd.get(k) ?? "").replace(/[,\s]/g, ""));
  const vehicle = String(fd.get("vehicle_id") ?? "");
  const seller = n("seller_amount"), fee = n("brokerage_amount") || 0, price = n("final_selling_price");
  if (!Number.isInteger(price) || price <= 0 || !Number.isInteger(seller) || seller < 0 || fee < 0) throw new Error("Check the amounts.");
  const { data, error } = await supabase.from("transactions").insert({
    vehicle_id: vehicle ? uuid.parse(vehicle) : null, seller_amount: seller, brokerage_amount: fee,
    final_selling_price: price, status: "pending", created_by: actor.id, notes: String(fd.get("notes") ?? "").slice(0, 1000) || null,
  }).select("id").single();
  must(error);
  await log("transaction.created", "transaction", data!.id);
  revalidatePath("/admin/transactions");
}
