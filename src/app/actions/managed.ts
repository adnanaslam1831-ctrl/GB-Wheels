"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { query } from "@/lib/db";
import { isDbConfigured } from "@/lib/env";
import { getSessionProfile } from "@/lib/session";
import type { ActionState } from "@/components/ui/form";

const requestSchema = z.object({
  contact_name: z.string().trim().min(2, "Enter your name").max(120),
  contact_phone: z.string().trim().regex(/^\+?[0-9\s-]{7,16}$/, "Enter a valid phone number"),
  preferred_contact: z.enum(["phone", "whatsapp", "email"]),
  vehicle_details: z.string().trim().min(5, "Describe the vehicle (brand, model, year)").max(500),
  location: z.string().trim().min(2, "Enter the vehicle's location").max(120),
  seller_asking_price: z.coerce.number().int().positive("Enter the amount you want to receive").max(10_000_000_000),
  description: z.string().trim().max(2000).optional(),
});

/** Public managed-sale request. Pricing is NOT set here: staff calculate it from a brokerage rule on the server. */
export async function requestManagedSale(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!isDbConfigured) return { error: "The database is not connected yet." };
  if (formData.get("website")) return { message: "Request received." }; // honeypot
  const raw = Object.fromEntries(formData);
  raw.seller_asking_price = String(raw.seller_asking_price ?? "").replace(/[,\s]/g, "");
  const parsed = requestSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const d = parsed.data;
  try {
    const user = await getSessionProfile();
    await query(
      `insert into managed_sales (contact_name, contact_phone, preferred_contact, vehicle_details, location, seller_asking_price, description, seller_id)
       values ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [d.contact_name, d.contact_phone, d.preferred_contact, d.vehicle_details, d.location, d.seller_asking_price, d.description || null, user?.id ?? null],
    );
    return { message: "Request received. A GB Wheels agent will contact you to discuss the brokerage fee and next steps." };
  } catch (e) {
    console.error("[managed]", (e as Error).message);
    return { error: "We could not submit your request. Please try again." };
  }
}

/** The seller explicitly agrees to the brokerage amount and advertised price. Only the owner, only once pricing exists. */
export async function agreeToManagedSale(id: string): Promise<{ ok: boolean; error?: string }> {
  if (!isDbConfigured) return { ok: false, error: "The database is not connected yet." };
  const user = await getSessionProfile();
  if (!user) return { ok: false, error: "Please sign in again." };
  if (!z.string().uuid().safeParse(id).success) return { ok: false, error: "Invalid request." };
  const rows = await query(
    `update managed_sales set seller_agreed = true, seller_agreed_at = now(), deal_status = 'agreed'
      where id = $1 and seller_id = $2 and advertised_price is not null and brokerage_amount is not null and deal_status = 'requested'
      returning id`,
    [id, user.id],
  );
  if (!rows.length) return { ok: false, error: "Nothing to agree to: pricing not set yet, already agreed, or not your request." };
  revalidatePath("/dashboard/managed");
  return { ok: true };
}
