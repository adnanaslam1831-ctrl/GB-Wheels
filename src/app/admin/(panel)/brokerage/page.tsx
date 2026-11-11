import { requireRole } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase/server";
import { saveRule, setDefaultRule, toggleRule } from "@/app/actions/admin";
import { formatPKR } from "@/lib/utils";

export const metadata = { title: "Manage Brokerage" };
export const dynamic = "force-dynamic";

export default async function BrokeragePage() {
  await requireRole(["super_admin"]);
  const s = (await getSupabase())!;
  const { data } = await s.from("brokerage_rules").select("*").order("created_at");
  const describe = (r: { type: string; fixed_amount: number | null; percentage: number | null; tiers: unknown }) =>
    r.type === "fixed" ? formatPKR(r.fixed_amount) : r.type === "percentage" ? `${r.percentage}% of seller amount` : r.type === "tiered" ? JSON.stringify(r.tiers) : r.type === "custom" ? "Entered per deal" : "No brokerage";
  return (
    <div className="space-y-6">
      <ul className="space-y-2">{(data ?? []).map((r) => (
        <li key={r.id} className="glass-card flex flex-wrap items-center justify-between gap-3 p-3 text-sm">
          <div><p className="font-semibold">{r.name} {r.is_default && <span className="ml-1 rounded bg-accent px-1.5 text-[10px] uppercase">Default</span>} {!r.is_active && <span className="ml-1 text-xs text-muted">(inactive)</span>}</p>
            <p className="break-all text-xs text-muted">{r.type}: {describe(r)}</p></div>
          <div className="flex gap-2">
            {!r.is_default && <form action={setDefaultRule}><input type="hidden" name="id" value={r.id} /><button className="btn-outline !min-h-8 !px-3 text-xs">Make default</button></form>}
            {!r.is_default && <form action={toggleRule}><input type="hidden" name="id" value={r.id} /><input type="hidden" name="on" value={String(!r.is_active)} /><button className="btn-outline !min-h-8 !px-3 text-xs">{r.is_active ? "Disable" : "Enable"}</button></form>}
          </div>
        </li>))}</ul>
      <form action={saveRule} className="glass-card space-y-3 p-4">
        <h2 className="font-display text-lg uppercase">Add a rule</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <input name="name" required placeholder="Rule name" className="input" />
          <select name="type" defaultValue="fixed" className="input"><option value="fixed">Fixed amount</option><option value="percentage">Percentage</option><option value="tiered">Tiered</option><option value="custom">Custom per deal</option><option value="zero">Zero brokerage</option></select>
          <input name="fixed_amount" inputMode="numeric" placeholder="Fixed amount (PKR)" className="input" />
          <input name="percentage" inputMode="decimal" placeholder="Percentage (e.g. 5)" className="input" />
        </div>
        <textarea name="tiers" rows={2} placeholder='Tiers JSON, e.g. [{"up_to":1000000,"amount":30000},{"up_to":null,"amount":60000}]' className="input py-2 font-mono text-xs" />
        <button className="btn-primary">Save rule</button>
      </form>
    </div>
  );
}
