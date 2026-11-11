"use server";

import { getSupabase } from "@/lib/supabase/server";

/** Toggles a favourite for the signed-in user. RLS restricts rows to the caller. */
export async function toggleFavorite(vehicleId: string, currentlySaved: boolean) {
  const supabase = await getSupabase();
  if (!supabase) return { ok: false as const, reason: "not_configured" as const };
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { ok: false as const, reason: "login" as const };

  const { error } = currentlySaved
    ? await supabase.from("favorites").delete().eq("user_id", data.user.id).eq("vehicle_id", vehicleId)
    : await supabase.from("favorites").insert({ user_id: data.user.id, vehicle_id: vehicleId });
  if (error) return { ok: false as const, reason: "error" as const };
  return { ok: true as const, saved: !currentlySaved };
}
