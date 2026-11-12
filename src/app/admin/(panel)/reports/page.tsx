import { EmptyState } from "@/components/ui/ConfigNotice";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireRole } from "@/lib/auth";
import { query } from "@/lib/db";
import { setReportStatus } from "@/app/actions/admin";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Manage Reports" };
export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  await requireRole(["super_admin", "listing_manager"]);
  const rows = await query(
    `select r.*, case when v.id is null then null else json_build_object('reference', v.reference, 'brand', v.brand, 'model', v.model, 'slug', v.slug) end as vehicles
       from reports r left join vehicles v on v.id = r.vehicle_id order by r.created_at desc limit 100`);
  return (
    <div className="space-y-3">
      {rows.length === 0 ? <EmptyState title="No reported listings" /> : rows.map((r) => (
        <div key={r.id} className="glass-card space-y-2 p-4 text-sm">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div><p className="font-semibold">{r.reason}</p>
              <p className="text-xs text-muted">{r.vehicles ? <a href={`/cars/${r.vehicles.slug}`} className="text-accent">{r.vehicles.brand} {r.vehicles.model} ({r.vehicles.reference})</a> : "Vehicle removed"} · {formatDate(r.created_at)}</p></div>
            <StatusBadge status={r.status} />
          </div>
          {r.details && <p className="text-muted">{r.details}</p>}
          <form action={setReportStatus} className="flex gap-2"><input type="hidden" name="id" value={r.id} />
            <select name="status" defaultValue={r.status} className="input !min-h-9 !w-auto">{["open", "reviewing", "resolved", "dismissed"].map((x) => <option key={x}>{x}</option>)}</select>
            <button className="btn-outline !min-h-9">Update</button></form>
        </div>))}
    </div>
  );
}
