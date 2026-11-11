import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { AdminNav } from "@/components/admin/AdminNav";
import type { UserRole } from "@/types/db";

export const metadata = { robots: { index: false, follow: false } };

const ALL: UserRole[] = ["super_admin", "listing_manager", "sales_agent", "photographer"];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireRole(ALL); // verified on the server for every admin page render
  return (
    <div className="container-gb py-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
        <div><h1 className="font-display text-2xl font-semibold uppercase">Admin</h1>
          <p className="text-xs text-muted">{profile.full_name ?? profile.email} · <span className="capitalize">{profile.role.replace("_", " ")}</span></p></div>
        <Link href="/" className="btn-outline">View site</Link>
      </div>
      <div className="grid gap-6 lg:grid-cols-[210px_1fr]">
        <AdminNav role={profile.role} />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
