"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSupabase } from "@/lib/supabase/server";
import { districts } from "@/config/site";
import type { ActionState } from "@/components/ui/form";

const schema = z.object({
  full_name: z.string().trim().min(2, "Enter your name").max(100),
  phone: z.string().trim().regex(/^\+?[0-9\s-]{7,16}$/, "Enter a valid phone number").or(z.literal("")),
  district: z.enum(districts).or(z.literal("")),
});

export async function updateProfile(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await getSupabase();
  if (!supabase) return { error: "The database is not connected yet." };
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return { error: "Please sign in again." };
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  // role / is_active are protected by a database trigger, so they cannot be changed here.
  const { error } = await supabase.from("profiles").update({
    full_name: parsed.data.full_name, phone: parsed.data.phone || null, district: parsed.data.district || null,
  }).eq("id", u.user.id);
  if (error) return { error: "Could not save your profile." };
  revalidatePath("/dashboard/profile");
  return { message: "Profile updated." };
}
