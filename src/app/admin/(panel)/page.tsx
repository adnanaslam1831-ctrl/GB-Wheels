import { requireRole } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase/server";
import { formatPKR } from "@/lib/utils";

export const metadata = { title: "Admin Dashboard" };
export const dynamic = "force-dynamic";

export default async function AdminHome() {
  await requireRole(["super_admin", "listing_manager", "sales_agent", "photographer"]);
  const s = (await getSupabase())!;
  const head = { count: "exact" as const, head: true };
  const [users, vehicles, active, pending, inquiries, managed, completed, completedRows] = await Promise.all([
    s.from("profiles").select("id", head),
    s.from("vehicles").select("id", head),
    s.from("vehicles").select("id", head).eq("status", "active"),
    s.from("vehicles").select("id", head).eq("status", "pending"),
    s.from("inquiries").select("id", head),
    s.from("managed_sales").select("id", head),
    s.from("transactions").select("id", head).eq("status", "completed"),
    s.from("transactions").select("brokerage_amount").eq("status", "completed"),
  ]);
  // Brokerage revenue counts completed transactions only.
  const revenue = (completedRows.data ?? []).reduce((a, r) => a + Number(r.brokerage_amount), 0);
  const stats: [string, string | number][] = [
    ["Total Users", users.count ?? 0], ["Total Vehicles", vehicles.count ?? 0], ["Active Listings", active.count ?? 0],
    ["Pending Listings", pending.count ?? 0], ["Total Inquiries", inquiries.count ?? 0], ["Managed Sale Requests", managed.count ?? 0],
    ["Completed Deals", completed.count ?? 0], ["Brokerage Revenue", formatPKR(revenue)],
  ];
  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {stats.map(([l, n]) => (
        <div key={l} className="glass-card p-4"><p className="text-xl font-bold sm:text-2xl">{n}</p><p className="text-xs text-muted">{l}</p></div>
      ))}
    </div>
  );
}
