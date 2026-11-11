"use server";

import { z } from "zod";
import { getSupabase } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { ActionState } from "@/components/ui/form";

const inquirySchema = z.object({
  vehicle_id: z.string().uuid(),
  buyer_name: z.string().trim().min(2, "Enter your name").max(120),
  buyer_phone: z.string().trim().regex(/^\+?[0-9\s-]{7,20}$/, "Enter a valid phone number"),
  message: z.string().trim().max(2000).optional(),
});

/** Creates a lead. Buyer contact details are visible to GB Wheels staff only (RLS). */
export async function createInquiry(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!isSupabaseConfigured) return { error: "The database is not connected yet." };
  if (formData.get("website")) return { message: "Thanks! GB Wheels will contact you shortly." }; // honeypot
  const parsed = inquirySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const supabase = await getSupabase();
  const { data: u } = await supabase!.auth.getUser();
  const { error } = await supabase!.from("inquiries").insert({
    ...parsed.data,
    message: parsed.data.message || null,
    user_id: u.user?.id ?? null,
    channel: "form",
  });
  if (error) return { error: "We could not send your inquiry. The listing may no longer be available." };
  return { message: "Inquiry sent. GB Wheels will contact you shortly." };
}

const reportSchema = z.object({
  vehicle_id: z.string().uuid(),
  reason: z.string().trim().min(3, "Choose a reason").max(120),
  details: z.string().trim().max(2000).optional(),
});

export async function reportListing(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!isSupabaseConfigured) return { error: "The database is not connected yet." };
  const parsed = reportSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const supabase = await getSupabase();
  const { data: u } = await supabase!.auth.getUser();
  const { error } = await supabase!.from("reports").insert({
    ...parsed.data,
    details: parsed.data.details || null,
    reporter_id: u.user?.id ?? null,
  });
  if (error) return { error: "We could not submit your report. Please try again." };
  return { message: "Thank you. Our team will review this listing." };
}
