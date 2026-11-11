"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/db";

const all: UserRole[] = ["super_admin", "listing_manager", "sales_agent", "photographer"];
const items: [string, string, UserRole[]][] = [
  ["/admin", "Dashboard", all],
  ["/admin/cars", "Manage Cars", ["super_admin", "listing_manager", "photographer"]],
  ["/admin/featured", "Featured Cars", ["super_admin", "listing_manager"]],
  ["/admin/inquiries", "Inquiries", ["super_admin", "listing_manager", "sales_agent"]],
  ["/admin/managed", "Managed Sales", ["super_admin", "listing_manager", "sales_agent"]],
  ["/admin/brokerage", "Brokerage Rules", ["super_admin"]],
  ["/admin/transactions", "Transactions", ["super_admin", "listing_manager", "sales_agent"]],
  ["/admin/reports", "Reports", ["super_admin", "listing_manager"]],
  ["/admin/users", "Users", ["super_admin"]],
  ["/admin/activity", "Activity Log", ["super_admin"]],
  ["/admin/settings", "Website Settings", ["super_admin"]],
];

export function AdminNav({ role }: { role: UserRole }) {
  const path = usePathname();
  return (
    <nav aria-label="Admin" className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0">
      {items.filter(([, , r]) => r.includes(role)).map(([href, label]) => {
        const active = href === "/admin" ? path === href : path.startsWith(href);
        return <Link key={href} href={href} className={cn("shrink-0 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition", active ? "bg-accent text-white" : "text-muted hover:bg-surface hover:text-white")}>{label}</Link>;
      })}
    </nav>
  );
}
