import Link from "next/link";
import { EmptyState } from "@/components/ui/ConfigNotice";
import { VehicleCard } from "@/components/vehicles/VehicleCard";
import { getSupabase } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import type { PublicVehicle, VehicleWithImage } from "@/types/db";

export const metadata = { title: "Saved Cars" };

export default async function SavedPage() {
  const user = await requireUser("/dashboard/saved");
  const supabase = await getSupabase();
  let vehicles: VehicleWithImage[] = [];
  if (supabase) {
    const { data: favs } = await supabase.from("favorites").select("vehicle_id").eq("user_id", user.id);
    const ids = (favs ?? []).map((f) => f.vehicle_id);
    if (ids.length) {
      const [{ data: vs }, { data: imgs }] = await Promise.all([
        supabase.from("public_vehicles").select("*").in("id", ids),
        supabase.from("vehicle_images").select("vehicle_id,url,is_cover").in("vehicle_id", ids).order("sort_order"),
      ]);
      const cover = new Map<string, string>();
      (imgs ?? []).forEach((i) => { if (i.is_cover || !cover.has(i.vehicle_id)) cover.set(i.vehicle_id, i.url); });
      vehicles = ((vs ?? []) as PublicVehicle[]).map((v) => ({ ...v, cover_url: cover.get(v.id) ?? null }));
    }
  }
  return (
    <div>
      <h2 className="mb-4 font-display text-xl uppercase">Saved Cars</h2>
      {vehicles.length === 0 ? (
        <EmptyState title="Nothing saved yet" body="Tap the heart on any car to keep it here." action={<Link href="/buy" className="btn-primary">Browse Cars</Link>} />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3">{vehicles.map((v) => <VehicleCard key={v.id} v={v} saved />)}</div>
      )}
    </div>
  );
}
