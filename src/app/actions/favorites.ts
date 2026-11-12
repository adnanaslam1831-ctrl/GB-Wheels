"use server";

import { z } from "zod";
import { query } from "@/lib/db";
import { isDbConfigured } from "@/lib/env";
import { getSessionProfile } from "@/lib/session";

/** Toggles a favourite for the signed-in user (only ever touches the caller's own rows). */
export async function toggleFavorite(vehicleId: string, currentlySaved: boolean) {
  if (!isDbConfigured) return { ok: false as const, reason: "not_configured" as const };
  const user = await getSessionProfile();
  if (!user) return { ok: false as const, reason: "login" as const };
  if (!z.string().uuid().safeParse(vehicleId).success) return { ok: false as const, reason: "error" as const };
  try {
    if (currentlySaved) await query("delete from favorites where user_id = $1 and vehicle_id = $2", [user.id, vehicleId]);
    else await query(
      `insert into favorites (user_id, vehicle_id)
       select $1, id from vehicles where id = $2 and status in ('active','reserved','sold')
       on conflict do nothing`, [user.id, vehicleId]);
    return { ok: true as const, saved: !currentlySaved };
  } catch {
    return { ok: false as const, reason: "error" as const };
  }
}
