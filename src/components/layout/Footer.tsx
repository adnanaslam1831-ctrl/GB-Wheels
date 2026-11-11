import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { Logo } from "./Logo";
import { navLinks, siteConfig } from "@/config/site";

export function Footer() {
  const { contact } = siteConfig;
  const socials = Object.entries(contact.social).filter(([, url]) => url);

  return (
    <footer className="border-t border-border bg-surface">
      <div className="container-gb grid gap-10 py-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
            {siteConfig.tagline} The dedicated marketplace for buying and selling cars across Gilgit-Baltistan.
          </p>
          {socials.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-4 text-sm">
              {socials.map(([name, url]) => (
                <li key={name}>
                  <a href={url} target="_blank" rel="noopener noreferrer" className="capitalize text-muted hover:text-accent">
                    {name}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h3 className="font-display text-sm uppercase tracking-wider text-white">Explore</h3>
          <ul className="mt-4 space-y-2 text-sm text-muted">
            {navLinks.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:text-accent">{l.label}</Link>
              </li>
            ))}
            <li><Link href="/privacy" className="hover:text-accent">Privacy Policy</Link></li>
            <li><Link href="/terms" className="hover:text-accent">Terms &amp; Conditions</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="font-display text-sm uppercase tracking-wider text-white">Contact</h3>
          <ul className="mt-4 space-y-3 text-sm text-muted">
            <li className="flex gap-2"><Phone className="mt-0.5 size-4 shrink-0 text-accent" />{contact.phone}</li>
            <li className="flex gap-2"><Mail className="mt-0.5 size-4 shrink-0 text-accent" />{contact.email}</li>
            <li className="flex gap-2"><MapPin className="mt-0.5 size-4 shrink-0 text-accent" />{contact.address}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-5 text-center text-xs text-muted">
        &copy; {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
      </div>
    </footer>
  );
}
