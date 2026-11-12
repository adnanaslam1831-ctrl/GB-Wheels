import { EmptyState } from "@/components/ui/ConfigNotice";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { query, safe } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "My Inquiries" };

export default async function InquiriesPage() {
  const user = await requireUser("/dashboard/inquiries");
  type Rcv = { id: string; buyer_name: string; message: string | null; status: string; created_at: string };
  type Snt = { id: string; message: string | null; status: string; created_at: string };
  const [snt, rcv] = await Promise.all([
    safe(() => query<Snt>("select id, message, status, created_at from inquiries where user_id = $1 order by created_at desc", [user.id]), [] as Snt[]),
    // Limited summary for the seller: no buyer phone number.
    safe(() => query<Rcv>(
      `select i.id, i.buyer_name, i.message, i.status, i.created_at from inquiries i join vehicles v on v.id = i.vehicle_id
        where v.seller_id = $1 order by i.created_at desc`, [user.id]), [] as Rcv[]),
  ]);
  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-3 font-display text-xl uppercase">On my cars</h2>
        <p className="mb-3 text-xs text-muted">Buyer contact details stay with GB Wheels, who coordinate with you.</p>
        {rcv.length === 0 ? <EmptyState title="No inquiries yet" body="When buyers ask about your cars, you will see them here." /> : (
          <ul className="space-y-2">{rcv.map((i) => (
            <li key={i.id} className="glass-card flex flex-wrap items-start justify-between gap-2 p-4 text-sm">
              <div><p className="font-semibold">{i.buyer_name}</p><p className="text-muted">{i.message ?? "No message"}</p><p className="mt-1 text-xs text-muted">{formatDate(i.created_at)}</p></div>
              <StatusBadge status={i.status} />
            </li>))}</ul>
        )}
      </section>
      <section>
        <h2 className="mb-3 font-display text-xl uppercase">Sent by me</h2>
        {snt.length === 0 ? <EmptyState title="You haven't contacted anyone yet" /> : (
          <ul className="space-y-2">{snt.map((i) => (
            <li key={i.id} className="glass-card flex items-start justify-between gap-2 p-4 text-sm">
              <div><p className="text-muted">{i.message ?? "No message"}</p><p className="mt-1 text-xs text-muted">{formatDate(i.created_at)}</p></div>
              <StatusBadge status={i.status} />
            </li>))}</ul>
        )}
      </section>
    </div>
  );
}
