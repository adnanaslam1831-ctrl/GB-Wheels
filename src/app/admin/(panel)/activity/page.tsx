import { EmptyState } from "@/components/ui/ConfigNotice";
import { requireRole } from "@/lib/auth";
import { query } from "@/lib/db";

export const metadata = { title: "Activity Log" };
export const dynamic = "force-dynamic";

export default async function ActivityPage() {
  await requireRole(["super_admin"]);
  const rows = await query("select * from activity_logs order by created_at desc limit 200");
  return rows.length === 0 ? <EmptyState title="No activity yet" /> : (
    <ul className="divide-y divide-border rounded-lg border border-border text-sm">
      {rows.map((a) => (
        <li key={a.id} className="flex flex-wrap justify-between gap-2 p-3"><span className="font-mono text-xs">{a.action}</span>
          <span className="text-xs text-muted">{a.entity_type} · {new Date(a.created_at).toLocaleString("en-GB")}</span></li>))}
    </ul>
  );
}
