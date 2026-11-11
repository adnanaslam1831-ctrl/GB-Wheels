import { notFound, redirect } from "next/navigation";
import { SellForm } from "@/components/sell/SellForm";
import { getSupabase } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import type { VehicleImage } from "@/types/db";
import type { VehicleFormValues } from "@/lib/validation/vehicle";

export const metadata = { title: "Edit Listing" };

export default async function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/dashboard/listings/${id}/edit`);
  const supabase = await getSupabase();
  if (!supabase) notFound();
  // seller_id filter + RLS: a seller can only ever load their own listing.
  const { data: v } = await supabase.from("vehicles").select("*").eq("id", id).eq("seller_id", user.id).maybeSingle();
  if (!v) notFound();
  if (v.status === "sold") redirect("/dashboard/listings");
  const { data: imgs } = await supabase.from("vehicle_images").select("*").eq("vehicle_id", id).order("sort_order");
  const { data: ms } = await supabase.from("managed_sales").select("contact_phone").eq("vehicle_id", id).maybeSingle();

  const s = (x: unknown) => (x == null ? "" : String(x));
  const initial: Partial<VehicleFormValues> = {
    brand: s(v.brand), model: s(v.model), variant: s(v.variant), model_year: s(v.model_year), registration_year: s(v.registration_year),
    engine_cc: s(v.engine_cc), color: s(v.color), fuel_type: s(v.fuel_type), transmission: s(v.transmission),
    steering_side: s(v.steering_side), import_origin: s(v.import_origin), mileage_km: s(v.mileage_km), condition: s(v.condition),
    engine_condition: s(v.engine_condition), suspension_condition: s(v.suspension_condition), tyre_condition: s(v.tyre_condition),
    accident_history: s(v.accident_history), repainted_panels: s(v.repainted_panels), known_defects: s(v.known_defects),
    documents_available: s(v.documents_available), registration_status: v.registration_status, customs_status: v.customs_status,
    district: s(v.district), town: s(v.town), description: s(v.description), seller_asking_price: s(v.seller_asking_price),
    selling_mode: v.selling_mode, contact_phone: s(ms?.contact_phone),
  };
  return (
    <div>
      <h2 className="mb-1 font-display text-xl uppercase">Edit Listing</h2>
      {v.status === "active" && <p className="mb-4 text-sm text-amber-200">Saving changes to a live listing sends it back for review.</p>}
      <SellForm userId={user.id} vehicleId={id} initial={initial} existingImages={(imgs ?? []) as VehicleImage[]} />
    </div>
  );
}
