import Link from "next/link";
import { EmptyState } from "@/components/ui/ConfigNotice";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireRole } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase/server";
import { adminDeleteVehicle, setVehicleStatus, setVerification, toggleFeatured } from "@/app/actions/admin";
import { formatPKR } from "@/lib/utils";

export const metadata = { title: "Manage Cars" };
export const dynamic = "force-dynamic";
const FILTERS = ["pending", "active", "draft", "rejected", "reserved", "sold", "expired"];

export default async function AdminCars({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const me = await requireRole(["super_admin", "listing_manager", "photographer"]);
  const canEdit = me.role !== "photographer";
  const { status = "pending" } = await searchParams;
  const s = (await getSupabase())!;
  const { data } = await s.from("vehicles").select("*").eq("status", FILTERS.includes(status) ? status : "pending").order("created_at", { ascending: false }).limit(100);
  const rows = data ?? [];
  const btn = "rounded-md border border-border px-3 py-1.5 text-xs font-semibold hover:border-accent hover:text-accent";
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">{FILTERS.map((f) => (
        <Link key={f} href={`/admin/cars?status=${f}`} className={`rounded-full border px-3 py-1 text-xs capitalize ${f === status ? "border-accent bg-accent/10 text-accent" : "border-border text-muted"}`}>{f}</Link>))}</div>
      {rows.length === 0 ? <EmptyState title={`No ${status} listings`} /> : rows.map((v) => (
        <article key={v.id} className="glass-card space-y-3 p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div><p className="font-display text-lg uppercase">{v.brand} {v.model} {v.model_year}</p>
              <p className="text-xs text-muted">{v.reference} · {v.district} · {v.selling_mode}{v.is_demo ? " · DEMO" : ""}</p></div>
            <StatusBadge status={v.status} />
          </div>
          <p className="text-sm">Seller price {formatPKR(v.seller_asking_price)} · Advertised {formatPKR(v.advertised_price)}</p>
          <div className="flex flex-wrap gap-3">
            <Link href={`/cars/${v.slug}`} className={btn}>Preview</Link>
            {canEdit && v.status !== "active" && (
              <form action={setVehicleStatus}><input type="hidden" name="id" value={v.id} /><input type="hidden" name="status" value="active" /><button className={btn}>Approve</button></form>
            )}
            {canEdit && v.status !== "rejected" && (
              <form action={setVehicleStatus} className="flex gap-1"><input type="hidden" name="id" value={v.id} /><input type="hidden" name="status" value="rejected" />
                <input name="reason" placeholder="Reason" required className="input !min-h-8 !w-40 !py-1 text-xs" /><button className={btn}>Reject</button></form>
            )}
            {canEdit && (
              <form action={toggleFeatured}><input type="hidden" name="id" value={v.id} /><input type="hidden" name="on" value={String(!v.is_featured)} /><button className={btn}>{v.is_featured ? "Unfeature" : "Feature"}</button></form>
            )}
            {canEdit && (
              <form action={adminDeleteVehicle}><input type="hidden" name="id" value={v.id} /><button className={`${btn} hover:!border-red-500 hover:!text-red-400`}>Delete</button></form>
            )}
          </div>
          {canEdit && (
            <form action={setVerification} className="flex flex-wrap items-center gap-4 border-t border-border pt-3 text-xs">
              <input type="hidden" name="id" value={v.id} />
              <span className="text-muted">Only tick after the check is really done:</span>
              {([["docs_reviewed", "Documents reviewed"], ["gbw_inspected", "GB Wheels inspected"], ["independently_verified", "Independently verified"]] as const).map(([k, l]) => (
                <label key={k} className="flex items-center gap-1"><input type="checkbox" name={k} defaultChecked={v[k]} className="accent-[#ed1026]" />{l}</label>))}
              <button className={btn}>Save</button>
            </form>
          )}
        </article>
      ))}
    </div>
  );
}
