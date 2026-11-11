"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CarFront, Heart, Home, PlusCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "Home", icon: Home },
  { href: "/buy", label: "Buy Cars", icon: CarFront },
  { href: "/sell", label: "Sell Car", icon: PlusCircle },
  { href: "/dashboard/saved", label: "Saved", icon: Heart },
  { href: "/dashboard", label: "Profile", icon: User },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  // Public mobile pages only: hide inside admin.
  if (pathname.startsWith("/admin")) return null;

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href === "/dashboard") return pathname === "/dashboard" || pathname.startsWith("/dashboard/profile") || pathname.startsWith("/dashboard/settings");
    return pathname.startsWith(href);
  };

  return (
    <nav
      aria-label="Bottom"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {items.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
                  active ? "text-accent" : "text-muted hover:text-white",
                )}
              >
                <Icon className="size-5" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
