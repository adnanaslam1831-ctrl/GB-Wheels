"use server";

import { del } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertRole } from "@/lib/auth";
import { query, queryOne, tx } from "@/lib/db";
import { newToken, sha256 } from "@/lib/session";
import { siteConfig } from "@/config/site";
import type { UserRole } from "@/types/db";

const LISTING: UserRole[] = ["super_admin", "listing_manager"];
const SALES: UserRole[] = ["super_admin", "listing_manager", "sales_agent"];
const MONEY: UserRole[] = ["super_admin", "sales_agent"];
const SUPER: UserRole[] = ["super_admin"];

/** Every action re-checks the signed-in user's role against the database. */
async function gate(roles: UserRole[]) {
  const actor = await assertRole(roles);
  const log = (action: string, entity_type: string, entity_id: string | null, metadata?: object) =>
    query("insert into activity_logs (actor_id, action, entity_type, entity_id, metadata) values ($1,$2,$3,$4,$5)",
      [actor.id, action, entity_type, entity_id, metadata ? JSON.stringify(metadata) : null]);
  return { actor, log };
}

const uuid = z.string().uuid();
const money = (v: FormDataEntryValue | null) => Number(String(v ?? "").replace(/[,\s]/g, ""));

// ---------- listings ----------
export async function setVehicleStatus(fd: FormData) {
  const { log } = await gate(LISTING);
  const id = uuid.parse(fd.get("id"));
  const status = z.enum(["active", "rejected", "pending", "expired", "reserved", "sold"]).parse(fd.get("status"));
  const reason = String(fd.get("reason") ?? "").trim().slice(0, 500) || null;
  if (status === "rejected" && !reason) throw new Error("Give a reason when rejecting a listing.");
  await query(
    `update vehicles set status = $1, rejection_reason = $2,
       published_at = case when $4::boolean then now() else published_at end where id = $3`,
    [status, status === "rejected" ? reason : null, id, status === "active"],
  );
  await log(`vehicle.${status}`, "vehicle", id, { reason });
  revalidatePath("/admin/cars"); revalidatePath("/admin");
}

export async function toggleFeatured(fd: FormData) {
  const { log } = await gate(LISTING);
  const id = uuid.parse(fd.get("id"));
  const on = fd.get("on") === "true";
  await query("update vehicles set is_featured = $1 where id = $2", [on, id]);
  await log(on ? "vehicle.featured" : "vehicle.unfeatured", "vehicle", id);
  revalidatePath("/admin/featured"); revalidatePath("/admin/cars");
}

/** Verification flags: set only after the check has genuinely happened. */
export async function setVerification(fd: FormData) {
  const { log } = await gate(LISTING);
  const id = uuid.parse(fd.get("id"));
  const p = {
    docs_reviewed: fd.get("docs_reviewed") === "on",
    gbw_inspected: fd.get("gbw_inspected") === "on",
    independently_verified: fd.get("independently_verified") === "on",
  };
  await query("update vehicles set docs_reviewed=$1, gbw_inspected=$2, independently_verified=$3 where id=$4",
    [p.docs_reviewed, p.gbw_inspected, p.independently_verified, id]);
  await log("vehicle.verification", "vehicle", id, p);
  revalidatePath("/admin/cars");
}

export async function adminDeleteVehicle(fd: FormData) {
  const { log } = await gate(LISTING);
  const id = uuid.parse(fd.get("id"));
  const imgs = await query<{ url: string }>("select url from vehicle_images where vehicle_id = $1", [id]);
  await query("delete from vehicles where id = $1", [id]);
  if (imgs.length && process.env.BLOB_READ_WRITE_TOKEN) await del(imgs.map((i) => i.url)).catch(() => {});
  await log("vehicle.deleted", "vehicle", id);
  revalidatePath("/admin/cars");
}

export async function setReportStatus(fd: FormData) {
  const { actor, log } = await gate(LISTING);
  const id = uuid.parse(fd.get("id"));
  const status = z.enum(["open", "reviewing", "resolved", "dismissed"]).parse(fd.get("status"));
  await query("update reports set status = $1, resolved_by = $2 where id = $3",
    [status, status === "resolved" || status === "dismissed" ? actor.id : null, id]);
  await log(`report.${status}`, "report", id);
  revalidatePath("/admin/reports");
}

// ---------- users ----------
export async function updateUser(fd: FormData) {
  const { actor, log } = await gate(SUPER);
  const id = uuid.parse(fd.get("id"));
  const role = z.enum(["user", "super_admin", "listing_manager", "sales_agent", "photographer"]).parse(fd.get("role"));
  const is_active = fd.get("is_active") === "on";
  if (id === actor.id && (role !== "super_admin" || !is_active)) throw new Error("You can't remove your own Super Admin access.");
  await tx(async (c) => {
    await c.query("update profiles set role = $1, is_active = $2 where id = $3", [role, is_active, id]);
    if (!is_active) await c.query("delete from sessions where user_id = $1", [id]);
  });
  await log("user.updated", "profile", id, { role, is_active });
  revalidatePath("/admin/users");
}

/** Super Admin issues a one-time reset link (1 hour) to hand to a user who cannot receive email. */
export async function createResetLink(userId: string): Promise<{ ok: true; link: string } | { ok: false; error: string }> {
  const { log } = await gate(SUPER);
  if (!uuid.safeParse(userId).success) return { ok: false, error: "User not found." };
  const user = await queryOne("select id from profiles where id = $1 and is_active", [userId]);
  if (!user) return { ok: false, error: "User not found or inactive." };
  const token = newToken();
  await query("insert into password_resets (user_id, token_hash, expires_at) values ($1,$2, now() + interval '1 hour')", [userId, sha256(token)]);
  await log("user.reset_link_issued", "profile", userId);
  return { ok: true, link: `${siteConfig.url}/reset-password?token=${token}` };
}

// ---------- inquiries ----------
export async function updateInquiry(fd: FormData) {
  const { log } = await gate(SALES);
  const id = uuid.parse(fd.get("id"));
  const status = z.enum(["new", "buyer_contacted", "seller_contacted", "viewing_arranged", "negotiation", "deal_confirmed", "completed", "unsuccessful"]).parse(fd.get("status"));
  const notes = String(fd.get("notes") ?? "").trim().slice(0, 4000) || null;
  const assigned = String(fd.get("assigned_to") ?? "");
  await query("update inquiries set status = $1, notes = $2, assigned_to = $3 where id = $4",
    [status, notes, assigned ? uuid.parse(assigned) : null, id]);
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
  const { log } = await gate(SUPER);
  const p = ruleSchema.parse(Object.fromEntries(fd));
  let fixed: number | null = null, pct: number | null = null, tiers: unknown = null;
  if (p.type === "fixed") {
    const n = Number(p.fixed_amount); if (!Number.isInteger(n) || n < 0) throw new Error("Enter a valid fixed amount.");
    fixed = n;
  } else if (p.type === "percentage") {
    const n = Number(p.percentage); if (!(n >= 0 && n <= 100)) throw new Error("Percentage must be 0 to 100.");
    pct = n;
  } else if (p.type === "tiered") {
    let t: unknown;
    try { t = JSON.parse(p.tiers ?? ""); } catch { throw new Error('Tiers must be JSON, e.g. [{"up_to":1000000,"amount":30000},{"up_to":null,"amount":60000}]'); }
    const ok = z.array(z.object({ up_to: z.number().positive().nullable(), amount: z.number().int().min(0) })).min(1).safeParse(t);
    if (!ok.success) throw new Error("Invalid tiers JSON.");
    tiers = ok.data;
  }
  const id = String(fd.get("id") ?? "");
  const tj = tiers ? JSON.stringify(tiers) : null;
  let rid: string;
  if (id) {
    rid = uuid.parse(id);
    await query("update brokerage_rules set name=$1, type=$2, fixed_amount=$3, percentage=$4, tiers=$5 where id=$6", [p.name, p.type, fixed, pct, tj, rid]);
  } else {
    rid = (await query<{ id: string }>("insert into brokerage_rules (name,type,fixed_amount,percentage,tiers) values ($1,$2,$3,$4,$5) returning id", [p.name, p.type, fixed, pct, tj]))[0].id;
  }
  await log("brokerage_rule.saved", "brokerage_rule", rid, { name: p.name, type: p.type });
  revalidatePath("/admin/brokerage");
}

export async function setDefaultRule(fd: FormData) {
  const { log } = await gate(SUPER);
  const id = uuid.parse(fd.get("id"));
  await tx(async (c) => {
    await c.query("update brokerage_rules set is_default = false where is_default");
    await c.query("update brokerage_rules set is_default = true, is_active = true where id = $1", [id]);
  });
  await log("brokerage_rule.default", "brokerage_rule", id);
  revalidatePath("/admin/brokerage");
}

export async function toggleRule(fd: FormData) {
  const { log } = await gate(SUPER);
  const id = uuid.parse(fd.get("id"));
  await query("update brokerage_rules set is_active = $1 where id = $2", [fd.get("on") === "true", id]);
  await log("brokerage_rule.toggled", "brokerage_rule", id);
  revalidatePath("/admin/brokerage");
}

// ---------- managed sales ----------
/** The fee and advertised price are computed in Postgres (calculate_brokerage); the browser only picks a rule. */
export async function applyPricing(fd: FormData) {
  const { log } = await gate(SALES);
  const id = uuid.parse(fd.get("id"));
  const rule = uuid.parse(fd.get("rule"));
  const raw = String(fd.get("custom") ?? "").replace(/[,\s]/g, "");
  const custom = raw === "" ? null : Number(raw);
  if (custom !== null && (!Number.isInteger(custom) || custom < 0)) throw new Error("Invalid custom amount.");
  await tx(async (c) => {
    const ms = (await c.query("select seller_asking_price, deal_status from managed_sales where id = $1 for update", [id])).rows[0];
    if (!ms) throw new Error("Managed sale not found.");
    if (["completed", "cancelled"].includes(ms.deal_status)) throw new Error("This deal is closed.");
    const r = (await c.query("select * from calculate_brokerage($1, $2, $3)", [rule, ms.seller_asking_price, custom])).rows[0];
    // New pricing always needs the seller's fresh agreement.
    await c.query(
      `update managed_sales set brokerage_rule_id=$1, brokerage_type=$2, brokerage_amount=$3, advertised_price=$4,
         seller_agreed=false, seller_agreed_at=null,
         deal_status = case when deal_status in ('listed','negotiating') then 'requested' else deal_status end
       where id = $5`,
      [rule, r.brokerage_type, r.brokerage_amount, r.advertised_price, id],
    );
  });
  await log("managed_sale.priced", "managed_sale", id);
  revalidatePath("/admin/managed");
}

export async function updateManagedSale(fd: FormData) {
  const { log } = await gate(SALES);
  const id = uuid.parse(fd.get("id"));
  const status = z.enum(["requested", "agreed", "listed", "negotiating", "cancelled"]).parse(fd.get("status"));
  const notes = String(fd.get("notes") ?? "").trim().slice(0, 4000) || null;
  await tx(async (c) => {
    const ms = (await c.query("select vehicle_id, advertised_price, seller_agreed, deal_status from managed_sales where id = $1 for update", [id])).rows[0];
    if (!ms) throw new Error("Managed sale not found.");
    if (ms.deal_status === "completed") throw new Error("This deal is already completed.");
    // 'listed' also publishes the linked vehicle at the agreed advertised price.
    if (status === "listed") {
      if (!ms.seller_agreed || !ms.advertised_price) throw new Error("The seller must agree to the pricing before the car is listed.");
      if (ms.vehicle_id) await c.query("update vehicles set advertised_price = $1 where id = $2", [ms.advertised_price, ms.vehicle_id]);
    }
    await c.query("update managed_sales set deal_status = $1, notes = $2 where id = $3", [status, notes, id]);
  });
  await log("managed_sale.updated", "managed_sale", id, { status });
  revalidatePath("/admin/managed");
}

/** Revenue is recorded only here, when staff confirm the sale actually completed. */
export async function completeManagedSale(fd: FormData) {
  const { actor, log } = await gate(MONEY);
  const id = uuid.parse(fd.get("id"));
  const price = money(fd.get("final_price"));
  if (!Number.isInteger(price) || price <= 0) throw new Error("Enter the final selling price.");
  await tx(async (c) => {
    const ms = (await c.query("select * from managed_sales where id = $1 for update", [id])).rows[0];
    if (!ms) throw new Error("Managed sale not found.");
    if (!ms.seller_agreed) throw new Error("The seller never agreed to the brokerage terms.");
    if (ms.deal_status === "completed") throw new Error("Already completed.");
    await c.query("update managed_sales set final_selling_price = $1, deal_status = 'completed' where id = $2", [price, id]);
    await c.query(
      `insert into transactions (vehicle_id, managed_sale_id, seller_amount, brokerage_amount, final_selling_price, status, completed_at, created_by)
       values ($1,$2,$3,$4,$5,'completed',now(),$6)`,
      [ms.vehicle_id, id, ms.seller_asking_price, ms.brokerage_amount ?? 0, price, actor.id],
    );
    if (ms.vehicle_id) await c.query("update vehicles set status = 'sold' where id = $1", [ms.vehicle_id]);
  });
  await log("managed_sale.completed", "managed_sale", id, { price });
  revalidatePath("/admin/managed"); revalidatePath("/admin/transactions"); revalidatePath("/admin");
}

// ---------- transactions ----------
export async function setTransactionStatus(fd: FormData) {
  const { log } = await gate(MONEY);
  const id = uuid.parse(fd.get("id"));
  const status = z.enum(["pending", "completed", "cancelled"]).parse(fd.get("status"));
  await query("update transactions set status = $1, completed_at = $2 where id = $3", [status, status === "completed" ? new Date().toISOString() : null, id]);
  await log(`transaction.${status}`, "transaction", id);
  revalidatePath("/admin/transactions"); revalidatePath("/admin");
}

export async function createTransaction(fd: FormData) {
  const { actor, log } = await gate(MONEY);
  const vehicle = String(fd.get("vehicle_id") ?? "");
  const seller = money(fd.get("seller_amount")), fee = money(fd.get("brokerage_amount")) || 0, price = money(fd.get("final_selling_price"));
  if (!Number.isInteger(price) || price <= 0 || !Number.isInteger(seller) || seller < 0 || !Number.isInteger(fee) || fee < 0) throw new Error("Check the amounts.");
  const r = await query<{ id: string }>(
    `insert into transactions (vehicle_id, seller_amount, brokerage_amount, final_selling_price, status, created_by, notes)
     values ($1,$2,$3,$4,'pending',$5,$6) returning id`,
    [vehicle ? uuid.parse(vehicle) : null, seller, fee, price, actor.id, String(fd.get("notes") ?? "").slice(0, 1000) || null],
  );
  await log("transaction.created", "transaction", r[0].id);
  revalidatePath("/admin/transactions");
}
