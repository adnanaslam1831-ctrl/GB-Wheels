import "server-only";
import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/session";
import type { Profile, UserRole } from "@/types/db";

export const STAFF_ROLES: UserRole[] = ["super_admin", "listing_manager", "sales_agent", "photographer"];

/** Open-redirect safe "next" parameter: only same-site relative paths. */
export function safeNext(next: string | null | undefined, fallback = "/dashboard") {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return fallback;
  return next;
}

export const getCurrentProfile = getSessionProfile;
export const getCurrentUser = getSessionProfile;

export async function requireUser(next = "/dashboard"): Promise<Profile> {
  const user = await getSessionProfile();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

/** Server-side role gate for pages. Returns the profile, or redirects. */
export async function requireRole(roles: UserRole[], loginPath = "/admin/login"): Promise<Profile> {
  const profile = await getSessionProfile();
  if (!profile) redirect(loginPath);
  if (!roles.includes(profile.role)) redirect("/admin/forbidden");
  return profile;
}

/** For server actions: throws instead of redirecting. */
export async function assertRole(roles: UserRole[]): Promise<Profile> {
  const profile = await getSessionProfile();
  if (!profile || !roles.includes(profile.role)) throw new Error("You are not authorised to do that.");
  return profile;
}
