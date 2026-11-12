import { requireRole } from "@/lib/auth";
import { queryOne } from "@/lib/db";
import { formatPKR } from "@/lib/utils";

export const metadata = { title: "Admin Dashboard" };
export const dynamic = "force-dynamic";

export default async function AdminHome() {
  await requireRole(["super_admin", "listing_manager", "sales_agent", "photographer"]);
  // Brokerage revenue counts completed transactions only.
  const r = (await queryOne(
    `select (select count(*)::int from profiles) as users,
            (select count(*)::int from vehicles) as vehicles,
            (select count(*)::int from vehicles where status = 'active') as active,
            (select count(*)::int from vehicles where status = 'pending') as pending,
            (select count(*)::int from inquiries) as inquiries,
            (select count(*)::int from managed_sales) as managed,
            (select count(*)::int from transactions where status = 'completed') as completed,
            (select coalesce(sum(brokerage_amount), 0) from transactions where status = 'completed') as revenue`,
  ))!;
  const revenue = Number(r.revenue);
  const stats: [string, string | number][] = [
    ["Total Users", r.users], ["Total Vehicles", r.vehicles], ["Active Listings", r.active],
    ["Pending Listings", r.pending], ["Total Inquiries", r.inquiries], ["Managed Sale Requests", r.managed],
    ["Completed Deals", r.completed], ["Brokerage Revenue", formatPKR(revenue)],
  ];
  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {stats.map(([l, n]) => (
        <div key={l} className="glass-card p-4"><p className="text-xl font-bold sm:text-2xl">{n}</p><p className="text-xs text-muted">{l}</p></div>
      ))}
    </div>
  );
}
