"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getSupabase } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { safeNext } from "@/lib/auth";
import { siteConfig } from "@/config/site";
import type { ActionState } from "@/components/ui/form";

const NOT_CONFIGURED: ActionState = {
  error: "The database is not connected yet. Add your Supabase credentials to .env.local (see README).",
};

const email = z.string().trim().toLowerCase().email("Enter a valid email address");
const password = z.string().min(8, "Password must be at least 8 characters").max(72, "Password is too long");
const phone = z
  .string()
  .trim()
  .regex(/^\+?[0-9\s-]{7,16}$/, "Enter a valid phone number")
  .optional()
  .or(z.literal(""));

function firstError(e: z.ZodError) {
  return e.issues[0]?.message ?? "Invalid input";
}

export async function login(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!isSupabaseConfigured) return NOT_CONFIGURED;
  const parsed = z.object({ email, password: z.string().min(1, "Enter your password") }).safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: firstError(parsed.error) };

  const supabase = await getSupabase();
  const { error } = await supabase!.auth.signInWithPassword(parsed.data);
  if (error) return { error: "Incorrect email or password." };

  const isAdminLogin = formData.get("area") === "admin";
  redirect(safeNext(formData.get("next") as string, isAdminLogin ? "/admin" : "/dashboard"));
}

export async function register(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!isSupabaseConfigured) return NOT_CONFIGURED;
  const parsed = z
    .object({
      full_name: z.string().trim().min(2, "Enter your full name").max(100),
      email,
      phone,
      password,
      confirm: z.string(),
    })
    .refine((v) => v.password === v.confirm, { message: "Passwords do not match", path: ["confirm"] })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };

  const supabase = await getSupabase();
  const { data, error } = await supabase!.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.full_name, phone: parsed.data.phone || null },
      emailRedirectTo: `${siteConfig.url}/auth/callback?next=/dashboard`,
    },
  });
  if (error) return { error: error.message };

  // With "Confirm email" enabled in Supabase there is no session until the link is clicked.
  if (!data.session) {
    return { message: "Account created. Check your email and click the confirmation link to sign in." };
  }
  redirect("/dashboard");
}

export async function forgotPassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!isSupabaseConfigured) return NOT_CONFIGURED;
  const parsed = z.object({ email }).safeParse({ email: formData.get("email") });
  if (!parsed.success) return { error: firstError(parsed.error) };

  const supabase = await getSupabase();
  await supabase!.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${siteConfig.url}/auth/callback?next=/reset-password`,
  });
  // Same answer whether or not the account exists (avoids account enumeration).
  return { message: "If an account exists for that email, a reset link has been sent." };
}

export async function resetPassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!isSupabaseConfigured) return NOT_CONFIGURED;
  const parsed = z
    .object({ password, confirm: z.string() })
    .refine((v) => v.password === v.confirm, { message: "Passwords do not match", path: ["confirm"] })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };

  const supabase = await getSupabase();
  const { error } = await supabase!.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: "This reset link has expired. Request a new one." };
  redirect("/dashboard");
}

export async function logout() {
  const supabase = await getSupabase();
  await supabase?.auth.signOut();
  redirect("/");
}
