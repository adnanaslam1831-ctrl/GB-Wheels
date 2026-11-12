"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { query } from "@/lib/db";
import { isDbConfigured } from "@/lib/env";
import { getSessionProfile } from "@/lib/session";
import { districts } from "@/config/site";
import type { ActionState } from "@/components/ui/form";

const schema = z.object({
  full_name: z.string().trim().min(2, "Enter your name").max(100),
  phone: z.string().trim().regex(/^\+?[0-9\s-]{7,16}$/, "Enter a valid phone number").or(z.literal("")),
  district: z.enum(districts).or(z.literal("")),
});

export async function updateProfile(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!isDbConfigured) return { error: "The database is not connected yet." };
  const user = await getSessionProfile();
  if (!user) return { error: "Please sign in again." };
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  // Only these three columns can ever be changed here: role / is_active / email are not accepted.
  await query("update profiles set full_name = $1, phone = $2, district = $3 where id = $4",
    [parsed.data.full_name, parsed.data.phone || null, parsed.data.district || null, user.id]);
  revalidatePath("/dashboard/profile");
  return { message: "Profile updated." };
}
