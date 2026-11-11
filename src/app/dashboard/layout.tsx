import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { DashboardNav } from "@/components/dashboard/DashboardNav";

export const metadata = { robots: { index: false } };
// Per-user pages: must never be prerendered at build time.
export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await requireUser("/dashboard");
  return (
    <div className="container-gb py-6 sm:py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold uppercase sm:text-3xl">My Account</h1>
        <Link href="/dashboard/listings/new" className="btn-primary hidden sm:inline-flex">Add New Car</Link>
      </div>
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <DashboardNav />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
