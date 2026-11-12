import { EmptyState } from "@/components/ui/ConfigNotice";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireRole } from "@/lib/auth";
import { query } from "@/lib/db";
import { applyPricing, completeManagedSale, updateManagedSale } from "@/app/actions/admin";
import { formatDate, formatPKR } from "@/lib/utils";

export const metadata = { title: "Managed-Sale Requests" };
export const dynamic = "force-dynamic";

export default async function ManagedAdmin() {
  const me = await requireRole(["super_admin", "listing_manager", "sales_agent"]);
  const canComplete = me.role === "super_admin" || me.role === "sales_agent";
  const [rows, rules] = await Promise.all([
    query("select * from managed_sales order by created_at desc limit 100"),
    query("select id, name, type, is_default from brokerage_rules where is_active order by created_at"),
  ]);
  return (
    <div className="space-y-4">
      {rows.length === 0 ? <EmptyState title="No managed-sale requests" /> : rows.map((m) => (
        <article key={m.id} className="glass-card space-y-3 p-4 text-sm">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div><p className="font-semibold">{m.vehicle_details}</p>
              <p className="text-xs text-muted">{m.contact_name} · <a href={`tel:${m.contact_phone}`} className="text-accent">{m.contact_phone}</a> · prefers {m.preferred_contact} · {m.location} · {formatDate(m.created_at)}</p></div>
            <StatusBadge status={m.deal_status} />
          </div>
          {m.description && <p className="text-muted">{m.description}</p>}
          <dl className="grid gap-2 sm:grid-cols-4">
            <div><dt className="text-xs text-muted">Seller wants</dt><dd className="font-semibold">{formatPKR(m.seller_asking_price)}</dd></div>
            <div><dt className="text-xs text-muted">Brokerage ({m.brokerage_type ?? "not set"})</dt><dd className="font-semibold">{m.brokerage_amount != null ? formatPKR(m.brokerage_amount) : "—"}</dd></div>
            <div><dt className="text-xs text-muted">Advertised</dt><dd className="font-semibold">{m.advertised_price != null ? formatPKR(m.advertised_price) : "—"}</dd></div>
            <div><dt className="text-xs text-muted">Seller agreed</dt><dd className="font-semibold">{m.seller_agreed ? "Yes" : "No"}</dd></div>
          </dl>
          {m.deal_status !== "completed" && m.deal_status !== "cancelled" && (
            <>
              <form action={applyPricing} className="flex flex-wrap items-end gap-2 border-t border-border pt-3">
                <input type="hidden" name="id" value={m.id} />
                <div><label className="label text-xs">Brokerage rule (calculated on the server)</label>
                  <select name="rule" defaultValue={rules.find((r) => r.is_default)?.id} className="input !min-h-9">{rules.map((r) => <option key={r.id} value={r.id}>{r.name} ({r.type})</option>)}</select></div>
                <div><label className="label text-xs">Custom fee (custom rules only)</label><input name="custom" inputMode="numeric" className="input !min-h-9 !w-36" /></div>
                <button className="btn-outline !min-h-9">Calculate &amp; propose</button>
              </form>
              <form action={updateManagedSale} className="flex flex-wrap items-end gap-2">
                <input type="hidden" name="id" value={m.id} />
                <select name="status" defaultValue={m.deal_status === "completed" ? "requested" : m.deal_status} className="input !min-h-9 !w-auto">
                  {["requested", "agreed", "listed", "negotiating", "cancelled"].map((st) => <option key={st}>{st}</option>)}</select>
                <input name="notes" defaultValue={m.notes ?? ""} placeholder="Notes" className="input !min-h-9 flex-1" />
                <button className="btn-outline !min-h-9">Update</button>
              </form>
              {canComplete && m.seller_agreed && (
                <form action={completeManagedSale} className="flex flex-wrap items-end gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/5 p-3">
                  <input type="hidden" name="id" value={m.id} />
                  <div><label className="label text-xs">Final selling price (sale confirmed)</label><input name="final_price" inputMode="numeric" required className="input !min-h-9 !w-40" /></div>
                  <button className="btn-primary !min-h-9">Mark completed &amp; record revenue</button>
                </form>
              )}
            </>
          )}
          {m.deal_status === "completed" && <p className="text-xs text-emerald-300">Completed at {formatPKR(m.final_selling_price)}.</p>}
        </article>))}
    </div>
  );
}
