"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const items = [
  ["/dashboard", "Overview"], ["/dashboard/listings", "My Listings"], ["/dashboard/listings/new", "Add New Car"],
  ["/dashboard/saved", "Saved Cars"], ["/dashboard/inquiries", "My Inquiries"], ["/dashboard/managed", "Managed Sales"],
  ["/dashboard/profile", "Profile"], ["/dashboard/settings", "Settings"],
] as const;

export function DashboardNav() {
  const path = usePathname();
  return (
    <nav aria-label="Account" className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0">
      {items.map(([href, label]) => {
        const active = href === "/dashboard" ? path === href : href === "/dashboard/listings" ? path === href || /^\/dashboard\/listings\/[^/]+\/edit/.test(path) : path.startsWith(href);
        return (
          <Link key={href} href={href} className={cn("shrink-0 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition",
            active ? "bg-accent text-white" : "text-muted hover:bg-surface hover:text-white")}>{label}</Link>
        );
      })}
    </nav>
  );
}
