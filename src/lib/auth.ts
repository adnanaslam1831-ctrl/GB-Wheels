import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { getSupabase } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/types/db";

export const STAFF_ROLES: UserRole[] = ["super_admin", "listing_manager", "sales_agent", "photographer"];

/** Open-redirect safe "next" parameter: only same-site relative paths. */
export function safeNext(next: string | null | undefined, fallback = "/dashboard") {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return fallback;
  return next;
}

export const getCurrentUser = cache(async () => {
  const supabase = await getSupabase();
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser(); // validates the token with Supabase
  return data.user ?? null;
});

export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const user = await getCurrentUser();
  const supabase = await getSupabase();
  if (!user || !supabase) return null;
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  return (data as Profile | null) ?? null;
});

export async function requireUser(next = "/dashboard") {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

/** Server-side role gate. Returns the profile, or redirects. Never trust the client. */
export async function requireRole(roles: UserRole[], loginPath = "/admin/login") {
  const user = await getCurrentUser();
  if (!user) redirect(loginPath);
  const profile = await getCurrentProfile();
  if (!profile || !profile.is_active || !roles.includes(profile.role)) redirect("/admin/forbidden");
  return profile;
}

/** For server actions: throws instead of redirecting. */
export async function assertRole(roles: UserRole[]) {
  const profile = await getCurrentProfile();
  if (!profile || !profile.is_active || !roles.includes(profile.role)) {
    throw new Error("You are not authorised to do that.");
  }
  return profile;
}
