"use server";

import { z } from "zod";
import { query } from "@/lib/db";
import { isDbConfigured } from "@/lib/env";
import { getSessionProfile } from "@/lib/session";
import type { ActionState } from "@/components/ui/form";

const inquirySchema = z.object({
  vehicle_id: z.string().uuid(),
  buyer_name: z.string().trim().min(2, "Enter your name").max(120),
  buyer_phone: z.string().trim().regex(/^\+?[0-9\s-]{7,20}$/, "Enter a valid phone number"),
  message: z.string().trim().max(2000).optional(),
});

/** Creates a lead. Buyer contact details are readable by GB Wheels staff only. Only public listings accept inquiries. */
export async function createInquiry(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!isDbConfigured) return { error: "The database is not connected yet." };
  if (formData.get("website")) return { message: "Thanks! GB Wheels will contact you shortly." }; // honeypot
  const parsed = inquirySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const d = parsed.data;
  try {
    const user = await getSessionProfile();
    const res = await query(
      `insert into inquiries (vehicle_id, user_id, buyer_name, buyer_phone, message, channel)
       select id, $2, $3, $4, $5, 'form' from vehicles where id = $1 and status in ('active','reserved')
       returning id`,
      [d.vehicle_id, user?.id ?? null, d.buyer_name, d.buyer_phone, d.message || null],
    );
    if (!res.length) return { error: "This listing is no longer available." };
    return { message: "Inquiry sent. GB Wheels will contact you shortly." };
  } catch (e) {
    console.error("[inquiry]", (e as Error).message);
    return { error: "We could not send your inquiry. Please try again." };
  }
}

const reportSchema = z.object({
  vehicle_id: z.string().uuid(),
  reason: z.string().trim().min(3, "Choose a reason").max(120),
  details: z.string().trim().max(2000).optional(),
});

export async function reportListing(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!isDbConfigured) return { error: "The database is not connected yet." };
  const parsed = reportSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const d = parsed.data;
  try {
    const user = await getSessionProfile();
    const res = await query(
      `insert into reports (vehicle_id, reporter_id, reason, details)
       select id, $2, $3, $4 from vehicles where id = $1 and status in ('active','reserved','sold') returning id`,
      [d.vehicle_id, user?.id ?? null, d.reason, d.details || null],
    );
    if (!res.length) return { error: "This listing is no longer available." };
    return { message: "Thank you. Our team will review this listing." };
  } catch (e) {
    console.error("[report]", (e as Error).message);
    return { error: "We could not submit your report. Please try again." };
  }
}
