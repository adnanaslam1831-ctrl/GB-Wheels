import Link from "next/link";
import { EmptyState } from "@/components/ui/ConfigNotice";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { AgreeButton } from "@/components/dashboard/AgreeButton";
import { getSupabase } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { formatPKR } from "@/lib/utils";

export const metadata = { title: "Managed Sales" };

export default async function ManagedPage() {
  const user = await requireUser("/dashboard/managed");
  const supabase = await getSupabase();
  const { data } = supabase
    ? await supabase.from("managed_sales").select("*").eq("seller_id", user.id).order("created_at", { ascending: false })
    : { data: [] };
  const rows = data ?? [];
  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl uppercase">Managed Sales</h2>
      {rows.length === 0 ? (
        <EmptyState title="No managed sale requests" action={<Link href="/managed-sale" className="btn-primary">Request a Managed Sale</Link>} />
      ) : rows.map((m) => (
        <article key={m.id} className="glass-card space-y-3 p-4">
          <div className="flex items-start justify-between gap-2"><p className="font-semibold">{m.vehicle_details}</p><StatusBadge status={m.deal_status} /></div>
          <dl className="grid gap-2 text-sm sm:grid-cols-3">
            <div><dt className="text-xs text-muted">You receive</dt><dd className="font-semibold">{formatPKR(m.seller_asking_price)}</dd></div>
            <div><dt className="text-xs text-muted">Brokerage fee</dt><dd className="font-semibold">{m.brokerage_amount != null ? formatPKR(m.brokerage_amount) : "To be confirmed"}</dd></div>
            <div><dt className="text-xs text-muted">Advertised price</dt><dd className="font-semibold">{m.advertised_price != null ? formatPKR(m.advertised_price) : "To be confirmed"}</dd></div>
          </dl>
          {m.advertised_price != null && !m.seller_agreed && m.deal_status === "requested" ? (
            <div className="space-y-2 rounded-md border border-accent/40 bg-accent/5 p-3 text-sm">
              <p>GB Wheels has proposed the figures above. Nothing is advertised until you agree.</p>
              <AgreeButton id={m.id} brokerage={formatPKR(m.brokerage_amount)} advertised={formatPKR(m.advertised_price)} />
            </div>
          ) : m.seller_agreed ? <p className="text-xs text-emerald-300">You agreed to these figures.</p>
            : <p className="text-xs text-muted">A GB Wheels agent will propose the brokerage fee and contact you.</p>}
        </article>
      ))}
    </div>
  );
}
