import { SellForm } from "@/components/sell/SellForm";
import { ConfigNotice } from "@/components/ui/ConfigNotice";
import { getCurrentProfile, requireUser } from "@/lib/auth";

export const metadata = { title: "Add New Car" };

export default async function NewListingPage() {
  const user = await requireUser("/dashboard/listings/new");
  const profile = await getCurrentProfile();
  return (
    <div>
      <ConfigNotice className="mb-4" />
      <h2 className="mb-4 font-display text-xl uppercase">Sell Your Car</h2>
      <SellForm userId={user.id} defaultPhone={profile?.phone ?? ""} />
    </div>
  );
}
