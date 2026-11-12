import Link from "next/link";
import { EmptyState } from "@/components/ui/ConfigNotice";
import { VehicleCard } from "@/components/vehicles/VehicleCard";
import { query, safe } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import type { VehicleWithImage } from "@/types/db";

export const metadata = { title: "Saved Cars" };

export default async function SavedPage() {
  const user = await requireUser("/dashboard/saved");
  const vehicles = await safe(
    () => query<VehicleWithImage>(
      `select pv.*, (select i.url from vehicle_images i where i.vehicle_id = pv.id order by i.is_cover desc, i.sort_order limit 1) as cover_url
         from favorites f join public_vehicles pv on pv.id = f.vehicle_id
        where f.user_id = $1 order by f.created_at desc`, [user.id]),
    [] as VehicleWithImage[],
  );
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
