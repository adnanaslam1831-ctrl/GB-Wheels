import { EmptyState } from "@/components/ui/ConfigNotice";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireRole } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase/server";
import { updateInquiry } from "@/app/actions/admin";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Manage Inquiries" };
export const dynamic = "force-dynamic";
const stages = ["new", "buyer_contacted", "seller_contacted", "viewing_arranged", "negotiation", "deal_confirmed", "completed", "unsuccessful"];

export default async function InquiriesAdmin({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireRole(["super_admin", "listing_manager", "sales_agent"]);
  const { status } = await searchParams;
  const s = (await getSupabase())!;
  let q = s.from("inquiries").select("*, vehicles(reference,brand,model,model_year)").order("created_at", { ascending: false }).limit(100);
  if (status && stages.includes(status)) q = q.eq("status", status);
  const [{ data }, { data: staff }] = await Promise.all([q, s.from("profiles").select("id,full_name,email").in("role", ["super_admin", "listing_manager", "sales_agent"])]);
  const rows = (data ?? []) as (Record<string, any> & { vehicles: { reference: string; brand: string; model: string; model_year: number } | null })[]; // eslint-disable-line @typescript-eslint/no-explicit-any
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <a href="/admin/inquiries" className={`rounded-full border px-3 py-1 text-xs ${!status ? "border-accent text-accent" : "border-border text-muted"}`}>All</a>
        {stages.map((st) => <a key={st} href={`/admin/inquiries?status=${st}`} className={`rounded-full border px-3 py-1 text-xs capitalize ${status === st ? "border-accent text-accent" : "border-border text-muted"}`}>{st.replace(/_/g, " ")}</a>)}
      </div>
      {rows.length === 0 ? <EmptyState title="No inquiries" /> : rows.map((i) => (
        <form key={i.id} action={updateInquiry} className="glass-card space-y-3 p-4 text-sm">
          <input type="hidden" name="id" value={i.id} />
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div><p className="font-semibold">{i.buyer_name} · <a href={`tel:${i.buyer_phone}`} className="text-accent">{i.buyer_phone}</a></p>
              <p className="text-xs text-muted">{i.vehicles ? `${i.vehicles.brand} ${i.vehicles.model} ${i.vehicles.model_year} (${i.vehicles.reference})` : "Vehicle removed"} · {formatDate(i.created_at)} · {i.channel}</p></div>
            <StatusBadge status={i.status} />
          </div>
          {i.message && <p className="rounded bg-surface-2 p-2 text-muted">{i.message}</p>}
          <div className="grid gap-2 sm:grid-cols-2">
            <select name="status" defaultValue={i.status} className="input !min-h-9">{stages.map((st) => <option key={st} value={st}>{st.replace(/_/g, " ")}</option>)}</select>
            <select name="assigned_to" defaultValue={i.assigned_to ?? ""} className="input !min-h-9"><option value="">Unassigned</option>{(staff ?? []).map((p) => <option key={p.id} value={p.id}>{p.full_name ?? p.email}</option>)}</select>
          </div>
          <textarea name="notes" rows={2} defaultValue={i.notes ?? ""} placeholder="Internal notes" className="input py-2" />
          <button className="btn-outline !min-h-9">Save</button>
        </form>))}
    </div>
  );
}
