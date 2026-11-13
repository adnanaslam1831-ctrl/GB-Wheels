import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { siFacebook, siInstagram, siTiktok, siYoutube } from "simple-icons";
import { Logo } from "./Logo";
import { contactReady, siteConfig } from "@/config/site";

const quick = [
  { href: "/", label: "Home" },
  { href: "/buy", label: "Buy Cars" },
  { href: "/sell", label: "Sell Your Car" },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact" },
];

const socials = [
  { key: "facebook", label: "Facebook", path: siFacebook.path },
  { key: "instagram", label: "Instagram", path: siInstagram.path },
  { key: "youtube", label: "YouTube", path: siYoutube.path },
  { key: "tiktok", label: "TikTok", path: siTiktok.path },
] as const;

export function Footer() {
  const { contact } = siteConfig;
  return (
    <footer className="relative overflow-hidden border-t border-border bg-bg pb-20 lg:pb-0">
      <div className="container-gb grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1.3fr_1fr] lg:gap-6">
        <div>
          <Logo className="w-48" />
          <p className="mt-3 max-w-xs text-sm text-muted">The dedicated marketplace for buying and selling cars across Gilgit-Baltistan.</p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white">Quick Links</h3>
          <ul className="mt-3 space-y-1.5 text-xs text-fg/90">
            {quick.map((l) => <li key={l.href}><Link href={l.href} className="hover:text-accent">{l.label}</Link></li>)}
            <li><Link href="/privacy" className="hover:text-accent">Privacy Policy</Link></li>
            <li><Link href="/terms" className="hover:text-accent">Terms &amp; Conditions</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white">Contact Us</h3>
          <ul className="mt-3 space-y-2.5 text-xs text-fg/90">
            {contactReady.phone && (
              <li><a href={`tel:${contact.phone.replace(/\s/g, "")}`} className="flex items-center gap-2.5 hover:text-accent"><Phone className="size-4 shrink-0 text-accent" aria-hidden />{contact.phone}</a></li>
            )}
            {contactReady.email && (
              <li><a href={`mailto:${contact.email}`} className="flex items-center gap-2.5 hover:text-accent"><Mail className="size-4 shrink-0 text-accent" aria-hidden />{contact.email}</a></li>
            )}
            <li className="flex items-center gap-2.5"><MapPin className="size-4 shrink-0 text-accent" aria-hidden />{contactReady.address ? contact.address : "Gilgit-Baltistan, Pakistan"}</li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white">Follow Us</h3>
          <ul className="mt-3 flex gap-2.5">
            {socials.map((s) => {
              const url = contact.social[s.key];
              const icon = <svg viewBox="0 0 24 24" aria-hidden className="size-5" fill="currentColor"><path d={s.path} /></svg>;
              const cls = "grid size-10 place-items-center rounded-full border border-accent/70 bg-surface text-white transition";
              return (
                <li key={s.key}>
                  {url ? (
                    <a href={url} target="_blank" rel="noopener noreferrer" aria-label={s.label} className={`${cls} hover:bg-accent`}>{icon}</a>
                  ) : (
                    <span aria-label={`${s.label} (not added yet)`} title="Not added yet" className={`${cls} opacity-45`}>{icon}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <div aria-hidden className="h-px bg-gradient-to-r from-transparent via-accent to-transparent" />
      <div className="container-gb flex flex-col items-center justify-between gap-1 py-4 text-xs text-fg/80 sm:flex-row">
        <span>&copy; {new Date().getFullYear()} GBWheels. All Rights Reserved.</span>
        <span className="font-display text-sm font-semibold italic text-white">{siteConfig.tagline}</span>
      </div>
    </footer>
  );
}
