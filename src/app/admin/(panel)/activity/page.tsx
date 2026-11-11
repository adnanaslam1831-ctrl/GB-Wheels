import { EmptyState } from "@/components/ui/ConfigNotice";
import { requireRole } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase/server";

export const metadata = { title: "Activity Log" };
export const dynamic = "force-dynamic";

export default async function ActivityPage() {
  await requireRole(["super_admin"]);
  const s = (await getSupabase())!;
  const { data } = await s.from("activity_logs").select("*").order("created_at", { ascending: false }).limit(200);
  const rows = data ?? [];
  return rows.length === 0 ? <EmptyState title="No activity yet" /> : (
    <ul className="divide-y divide-border rounded-lg border border-border text-sm">
      {rows.map((a) => (
        <li key={a.id} className="flex flex-wrap justify-between gap-2 p-3"><span className="font-mono text-xs">{a.action}</span>
          <span className="text-xs text-muted">{a.entity_type} · {new Date(a.created_at).toLocaleString("en-GB")}</span></li>))}
    </ul>
  );
}
