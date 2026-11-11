import Link from "next/link";
import { ConfigNotice } from "@/components/ui/ConfigNotice";
import { getSupabase } from "@/lib/supabase/server";
import { getCurrentProfile, getCurrentUser } from "@/lib/auth";

export default async function DashboardHome() {
  const [user, profile, supabase] = await Promise.all([getCurrentUser(), getCurrentProfile(), getSupabase()]);
  let counts = { total: 0, active: 0, pending: 0, views: 0, saved: 0 };
  if (supabase && user) {
    const [{ data: vs }, { count: saved }] = await Promise.all([
      supabase.from("vehicles").select("status,view_count").eq("seller_id", user.id),
      supabase.from("favorites").select("vehicle_id", { count: "exact", head: true }).eq("user_id", user.id),
    ]);
    const rows = vs ?? [];
    counts = {
      total: rows.length, active: rows.filter((r) => r.status === "active").length,
      pending: rows.filter((r) => r.status === "pending").length,
      views: rows.reduce((a, r) => a + (r.view_count ?? 0), 0), saved: saved ?? 0,
    };
  }
  const stats = [["My listings", counts.total], ["Active", counts.active], ["Pending approval", counts.pending], ["Total views", counts.views], ["Saved cars", counts.saved]];
  return (
    <div className="space-y-6">
      <ConfigNotice />
      <p className="text-muted">Welcome{profile?.full_name ? `, ${profile.full_name}` : ""}.</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {stats.map(([l, n]) => (
          <div key={l as string} className="glass-card p-4"><p className="text-2xl font-bold">{n}</p><p className="text-xs text-muted">{l}</p></div>
        ))}
      </div>
      <div className="flex flex-wrap gap-3">
        <Link href="/dashboard/listings/new" className="btn-primary">Add New Car</Link>
        <Link href="/dashboard/listings" className="btn-outline">Manage Listings</Link>
      </div>
    </div>
  );
}
