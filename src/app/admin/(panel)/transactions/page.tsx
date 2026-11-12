import { EmptyState } from "@/components/ui/ConfigNotice";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireRole } from "@/lib/auth";
import { query } from "@/lib/db";
import { createTransaction, setTransactionStatus } from "@/app/actions/admin";
import { formatDate, formatPKR } from "@/lib/utils";

export const metadata = { title: "Manage Transactions" };
export const dynamic = "force-dynamic";

export default async function TransactionsPage() {
  const me = await requireRole(["super_admin", "listing_manager", "sales_agent"]);
  const canWrite = me.role === "super_admin" || me.role === "sales_agent";
  const rows = await query(
    `select t.*, case when v.id is null then null else json_build_object('reference', v.reference, 'brand', v.brand, 'model', v.model) end as vehicles
       from transactions t left join vehicles v on v.id = t.vehicle_id order by t.created_at desc limit 100`);
  return (
    <div className="space-y-5">
      <p className="text-sm text-muted">Brokerage revenue counts only transactions marked <strong className="text-white">completed</strong>.</p>
      {rows.length === 0 ? <EmptyState title="No transactions yet" /> : rows.map((t) => (
        <div key={t.id} className="glass-card flex flex-wrap items-center justify-between gap-3 p-3 text-sm">
          <div><p className="font-semibold">{t.vehicles ? `${t.vehicles.brand} ${t.vehicles.model} (${t.vehicles.reference})` : "Vehicle removed"}</p>
            <p className="text-xs text-muted">Sold {formatPKR(t.final_selling_price)} · seller {formatPKR(t.seller_amount)} · brokerage {formatPKR(t.brokerage_amount)} · {formatDate(t.created_at)}</p></div>
          <div className="flex items-center gap-2"><StatusBadge status={t.status} />
            {canWrite && t.status === "pending" && (<>
              <form action={setTransactionStatus}><input type="hidden" name="id" value={t.id} /><input type="hidden" name="status" value="completed" /><button className="btn-outline !min-h-8 !px-3 text-xs">Complete</button></form>
              <form action={setTransactionStatus}><input type="hidden" name="id" value={t.id} /><input type="hidden" name="status" value="cancelled" /><button className="btn-outline !min-h-8 !px-3 text-xs">Cancel</button></form>
            </>)}</div>
        </div>))}
      {canWrite && (
        <form action={createTransaction} className="glass-card space-y-3 p-4">
          <h2 className="font-display text-lg uppercase">Record a transaction (pending)</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <input name="vehicle_id" placeholder="Vehicle ID (optional UUID)" className="input" />
            <input name="final_selling_price" inputMode="numeric" required placeholder="Final selling price" className="input" />
            <input name="seller_amount" inputMode="numeric" required placeholder="Amount to seller" className="input" />
            <input name="brokerage_amount" inputMode="numeric" placeholder="Brokerage amount" className="input" />
          </div>
          <input name="notes" placeholder="Notes" className="input" /><button className="btn-primary">Create</button>
        </form>)}
    </div>
  );
}
