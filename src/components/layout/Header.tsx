"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Logo } from "./Logo";
import { navLinks } from "@/config/site";
import { cn } from "@/lib/utils";
import { logout } from "@/app/(auth)/actions";
import { useAuthState } from "./useAuthState";

export function Header() {
  const auth = useAuthState();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b transition-colors duration-300",
        scrolled || open
          ? "border-border bg-bg/90 backdrop-blur-md"
          : "border-transparent bg-bg/50 backdrop-blur-sm",
      )}
    >
      <div className="container-gb flex h-16 items-center justify-between">
        <Logo />

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          {navLinks.map((l) => {
            const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active ? "text-accent" : "text-fg/80 hover:text-white",
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          {auth.signedIn ? (
            <>
              {auth.isStaff && <Link href="/admin" className="btn-ghost">Admin</Link>}
              <Link href="/dashboard" className="btn-outline">My Account</Link>
              <form action={logout}><button className="btn-ghost">Logout</button></form>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-ghost">Login</Link>
              <Link href="/register" className="btn-primary">Register</Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="grid size-11 place-items-center rounded-md text-white lg:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            aria-label="Mobile"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-x-0 top-16 h-[calc(100dvh-4rem)] overflow-y-auto border-t border-border bg-bg/95 backdrop-blur-lg lg:hidden"
          >
            <ul className="container-gb flex flex-col py-4">
              {navLinks.map((l, i) => (
                <motion.li
                  key={l.href}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.04 * i }}
                >
                  <Link
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="block border-b border-border py-4 font-display text-lg uppercase tracking-wide text-fg"
                  >
                    {l.label}
                  </Link>
                </motion.li>
              ))}
              <li className="mt-6 grid grid-cols-2 gap-3">
                {auth.signedIn ? (
                  <>
                    <Link href={auth.isStaff ? "/admin" : "/dashboard"} onClick={() => setOpen(false)} className="btn-outline">
                      {auth.isStaff ? "Admin" : "My Account"}
                    </Link>
                    <form action={logout} className="contents"><button className="btn-primary">Logout</button></form>
                  </>
                ) : (
                  <>
                    <Link href="/login" onClick={() => setOpen(false)} className="btn-outline">Login</Link>
                    <Link href="/register" onClick={() => setOpen(false)} className="btn-primary">Register</Link>
                  </>
                )}
              </li>
            </ul>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
