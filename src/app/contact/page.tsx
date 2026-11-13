import type { Metadata } from "next";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { contactReady, siteConfig } from "@/config/site";

export const metadata: Metadata = { title: "Contact Us" };

export default function ContactPage() {
  const c = siteConfig.contact;
  // Only show details that have really been set; never show placeholders to visitors.
  const items = [
    contactReady.phone && { icon: Phone, label: "Phone", value: c.phone, href: `tel:${c.phone.replace(/\s/g, "")}` },
    contactReady.whatsapp && { icon: MessageCircle, label: "WhatsApp", value: `+${c.whatsapp}`, href: `https://wa.me/${c.whatsapp}` },
    contactReady.email && { icon: Mail, label: "Email", value: c.email, href: `mailto:${c.email}` },
    { icon: MapPin, label: "Location", value: contactReady.address ? c.address : "Gilgit-Baltistan, Pakistan", href: null as string | null },
  ].filter(Boolean) as { icon: typeof Phone; label: string; value: string; href: string | null }[];
  const socials = Object.entries(c.social).filter(([, u]) => u);
  return (
    <section className="container-gb max-w-3xl py-14">
      <h1 className="font-display text-4xl font-semibold uppercase">Contact GB Wheels</h1>
      <p className="mt-2 text-muted">Questions about buying, selling or a managed sale? Reach out.</p>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2">
        {items.map(({ icon: I, label, value, href }) => (
          <li key={label} className="glass-card flex items-start gap-3 p-4">
            <I className="mt-0.5 size-5 shrink-0 text-accent" />
            <div><p className="text-xs uppercase tracking-wide text-muted">{label}</p>
              {href ? <a href={href} className="font-medium hover:text-accent">{value}</a> : <p className="font-medium">{value}</p>}</div>
          </li>))}
      </ul>
      {socials.length > 0 && <p className="mt-6 flex flex-wrap gap-4 text-sm">{socials.map(([n, u]) => <a key={n} href={u} target="_blank" rel="noopener noreferrer" className="capitalize text-accent hover:underline">{n}</a>)}</p>}
    </section>
  );
}
