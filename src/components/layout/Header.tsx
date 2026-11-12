"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, House, MapPin, Menu, User, X } from "lucide-react";
import { Logo } from "./Logo";
import { cn } from "@/lib/utils";
import { logout } from "@/app/(auth)/actions";
import { useAuthState } from "./useAuthState";

type Item = { label: string; href: string; icon?: boolean; children?: { label: string; href: string }[] };

const nav: Item[] = [
  { label: "Home", href: "/", icon: true },
  { label: "Buy Cars", href: "/buy", children: [
    { label: "Browse all cars", href: "/buy" },
    { label: "Toyota", href: "/buy?brand=Toyota" },
    { label: "Honda", href: "/buy?brand=Honda" },
    { label: "Suzuki", href: "/buy?brand=Suzuki" },
  ] },
  { label: "Sell Your Car", href: "/sell", children: [
    { label: "List your car", href: "/sell" },
    { label: "Managed sale", href: "/managed-sale" },
  ] },
  { label: "Managed Sale", href: "/managed-sale" },
  { label: "Listings", href: "/buy", children: [
    { label: "Latest cars", href: "/buy?sort=newest" },
    { label: "Price: low to high", href: "/buy?sort=price_asc" },
    { label: "Price: high to low", href: "/buy?sort=price_desc" },
  ] },
  { label: "More", href: "#", children: [
    { label: "About Us", href: "/about" },
    { label: "Contact", href: "/contact" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms & Conditions", href: "/terms" },
  ] },
];

function Dropdown({ item, active }: { item: Item; active: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", esc); };
  }, [open]);
  return (
    <div ref={ref} className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn("flex items-center gap-1 rounded-md px-3 py-2 text-sm font-semibold transition-colors", active ? "text-accent" : "text-fg hover:text-accent")}
      >
        {item.label}
        <ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <ul role="menu" className="absolute left-0 top-full z-50 min-w-48 overflow-hidden rounded-lg border border-border bg-surface py-1 shadow-2xl">
          {item.children!.map((c) => (
            <li key={c.label} role="none">
              <Link role="menuitem" href={c.href} onClick={() => setOpen(false)} className="block px-4 py-2.5 text-sm text-fg/90 hover:bg-surface-2 hover:text-accent">
                {c.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

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
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : href !== "#" && pathname.startsWith(href.split("?")[0]));

  return (
    <header className={cn("sticky top-0 z-40 transition-colors duration-300", scrolled || open ? "bg-bg/95 backdrop-blur-md" : "bg-bg/60 backdrop-blur-sm")}>
      {/* Utility bar (desktop) */}
      <div className="hidden border-b border-border/70 lg:block">
        <div className="container-gb flex h-9 items-center justify-between text-xs text-fg">
          <span className="flex items-center gap-2"><MapPin className="size-3.5" />Gilgit-Baltistan, Pakistan</span>
          <div className="flex items-center gap-6">
            <Link href="/about" className="hover:text-accent">About Us</Link>
            <Link href="/contact" className="hover:text-accent">Contact</Link>
            {auth.signedIn ? (
              <span className="flex items-center gap-4 border-l border-border pl-6">
                {auth.isStaff && <Link href="/admin" className="hover:text-accent">Admin</Link>}
                <Link href="/dashboard" className="flex items-center gap-1.5 hover:text-accent"><User className="size-3.5" />My Account</Link>
                <form action={logout}><button className="hover:text-accent">Logout</button></form>
              </span>
            ) : (
              <Link href="/login" className="flex items-center gap-1.5 border-l border-border pl-6 hover:text-accent">
                <User className="size-3.5" />Login / Register
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="container-gb flex h-16 items-center justify-between lg:h-20">
        {/* Mobile: logo left. Desktop: nav left, logo right (as in the design). */}
        <Logo priority className="w-32 sm:w-36 lg:order-2 lg:w-52" />

        <nav className="hidden items-center gap-1 lg:order-1 lg:flex" aria-label="Main">
          {nav.map((l) =>
            l.children ? (
              <Dropdown key={l.label} item={l} active={isActive(l.href)} />
            ) : l.icon ? (
              <Link key={l.label} href={l.href} className={cn("mr-1 flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold", isActive(l.href) ? "bg-accent text-white red-glow" : "text-fg hover:text-accent")}>
                <House className="size-4" />{l.label}
              </Link>
            ) : (
              <Link key={l.label} href={l.href} className={cn("rounded-md px-3 py-2 text-sm font-semibold", isActive(l.href) ? "text-accent" : "text-fg hover:text-accent")}>
                {l.label}
              </Link>
            ),
          )}
        </nav>

        <button
          type="button"
          className="grid size-11 place-items-center rounded-md text-white lg:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="size-7" /> : <Menu className="size-7" />}
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
            className="absolute inset-x-0 top-16 h-[calc(100dvh-4rem)] overflow-y-auto border-t border-border bg-bg/98 backdrop-blur-lg lg:hidden"
          >
            <ul className="container-gb flex flex-col py-4">
              {[
                { label: "Home", href: "/" }, { label: "Buy Cars", href: "/buy" }, { label: "Sell Your Car", href: "/sell" },
                { label: "Managed Sale", href: "/managed-sale" }, { label: "About Us", href: "/about" }, { label: "Contact", href: "/contact" },
              ].map((l, i) => (
                <motion.li key={l.href} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.04 * i }}>
                  <Link href={l.href} onClick={() => setOpen(false)} className={cn("block border-b border-border py-4 font-display text-lg font-semibold", isActive(l.href) ? "text-accent" : "text-fg")}>
                    {l.label}
                  </Link>
                </motion.li>
              ))}
              <li className="mt-6 grid grid-cols-2 gap-3">
                {auth.signedIn ? (
                  <>
                    <Link href={auth.isStaff ? "/admin" : "/dashboard"} onClick={() => setOpen(false)} className="btn-outline">{auth.isStaff ? "Admin" : "My Account"}</Link>
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
