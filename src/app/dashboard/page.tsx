import Link from "next/link";
import { ConfigNotice } from "@/components/ui/ConfigNotice";
import { queryOne, safe } from "@/lib/db";
import { getCurrentProfile } from "@/lib/auth";

export default async function DashboardHome() {
  const profile = await getCurrentProfile();
  let counts = { total: 0, active: 0, pending: 0, views: 0, saved: 0 };
  if (profile) {
    const r = await safe(
      () => queryOne<{ total: number; active: number; pending: number; views: number; saved: number }>(
        `select count(*)::int as total,
                count(*) filter (where status = 'active')::int as active,
                count(*) filter (where status = 'pending')::int as pending,
                coalesce(sum(view_count), 0)::int as views,
                (select count(*)::int from favorites where user_id = $1) as saved
           from vehicles where seller_id = $1`, [profile.id]),
      null,
    );
    if (r) counts = r;
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
