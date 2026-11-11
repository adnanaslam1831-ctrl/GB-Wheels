import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { EmptyState } from "@/components/ui/ConfigNotice";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ListingActions } from "@/components/dashboard/ListingActions";
import { getSupabase } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { formatPKR } from "@/lib/utils";
import type { ListingStatus } from "@/types/db";

export const metadata = { title: "My Listings" };

type Row = { id: string; slug: string; reference: string; brand: string; model: string; model_year: number; status: ListingStatus; seller_asking_price: number; advertised_price: number; selling_mode: string; view_count: number; rejection_reason: string | null };

export default async function ListingsPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const { saved } = await searchParams;
  const user = await requireUser("/dashboard/listings");
  const supabase = await getSupabase();
  const { data } = supabase
    ? await supabase.from("vehicles").select("id,slug,reference,brand,model,model_year,status,seller_asking_price,advertised_price,selling_mode,view_count,rejection_reason").eq("seller_id", user.id).order("created_at", { ascending: false })
    : { data: [] };
  const rows = (data ?? []) as Row[];
  return (
    <div className="space-y-4">
      {saved && (
        <p role="status" className="flex items-center gap-2 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
          <CheckCircle2 className="size-4" />{saved === "submitted" ? "Submitted! Your listing is now Pending Approval." : "Draft saved. Finish it any time from here."}
        </p>
      )}
      <div className="flex items-center justify-between"><h2 className="font-display text-xl uppercase">My Listings</h2><Link href="/dashboard/listings/new" className="btn-primary sm:hidden">Add</Link></div>
      {rows.length === 0 ? (
        <EmptyState title="No listings yet" body="Add your first car. It takes a few minutes." action={<Link href="/dashboard/listings/new" className="btn-primary">Add New Car</Link>} />
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li key={r.id} className="glass-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-display text-lg uppercase">{r.brand} {r.model} {r.model_year}</p>
                  <p className="text-xs text-muted">Ref {r.reference} · {r.view_count} views{r.selling_mode === "managed" ? " · Managed sale" : ""}</p>
                </div>
                <StatusBadge status={r.status} />
              </div>
              <p className="mt-2 text-sm">
                Your price: <strong>{formatPKR(r.seller_asking_price)}</strong>
                {r.selling_mode === "managed" && r.advertised_price !== r.seller_asking_price && <span className="text-muted"> · Advertised: {formatPKR(r.advertised_price)}</span>}
              </p>
              {r.status === "rejected" && r.rejection_reason && <p className="mt-2 rounded bg-red-500/10 p-2 text-xs text-red-200">Rejected: {r.rejection_reason}</p>}
              <div className="mt-3"><ListingActions id={r.id} slug={r.slug} status={r.status} /></div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
