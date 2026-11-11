"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSupabase } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
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

/** Public managed-sale request. Pricing is NOT set here: staff calculate it on the server from a brokerage rule. */
export async function requestManagedSale(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!isSupabaseConfigured) return { error: "The database is not connected yet." };
  if (formData.get("website")) return { message: "Request received." }; // honeypot
  const raw = Object.fromEntries(formData);
  raw.seller_asking_price = String(raw.seller_asking_price ?? "").replace(/[,\s]/g, "");
  const parsed = requestSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const supabase = await getSupabase();
  const { data: u } = await supabase!.auth.getUser();
  const { error } = await supabase!.from("managed_sales").insert({
    ...parsed.data, description: parsed.data.description || null, seller_id: u.user?.id ?? null,
  });
  if (error) return { error: "We could not submit your request. Please try again." };
  return { message: "Request received. A GB Wheels agent will contact you to discuss the brokerage fee and next steps." };
}

/** Seller explicitly agrees to the brokerage amount and advertised price (checked in the database). */
export async function agreeToManagedSale(id: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await getSupabase();
  if (!supabase) return { ok: false, error: "The database is not connected yet." };
  const { error } = await supabase.rpc("agree_to_managed_sale", { p_managed_sale: id });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/managed");
  return { ok: true };
}
