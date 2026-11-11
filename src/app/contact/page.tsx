import type { Metadata } from "next";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { contactReady, siteConfig } from "@/config/site";

export const metadata: Metadata = { title: "Contact Us" };

export default function ContactPage() {
  const c = siteConfig.contact;
  const items = [
    { icon: Phone, label: "Phone", value: c.phone, href: contactReady.phone ? `tel:${c.phone.replace(/\s/g, "")}` : null },
    { icon: MessageCircle, label: "WhatsApp", value: contactReady.whatsapp ? `+${c.whatsapp}` : "Not set yet", href: contactReady.whatsapp ? `https://wa.me/${c.whatsapp}` : null },
    { icon: Mail, label: "Email", value: c.email, href: contactReady.email ? `mailto:${c.email}` : null },
    { icon: MapPin, label: "Location", value: c.address, href: null },
  ];
  const socials = Object.entries(c.social).filter(([, u]) => u);
  return (
    <section className="container-gb max-w-3xl py-14">
      <h1 className="font-display text-4xl font-semibold uppercase">Contact GB Wheels</h1>
      <p className="mt-2 text-muted">Questions about buying, selling or a managed sale? Reach out.</p>
      {!(contactReady.phone && contactReady.email) && (
        <p className="mt-4 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-100">
          Contact details are placeholders. Set the <code>NEXT_PUBLIC_BUSINESS_*</code> variables in <code>.env.local</code> (see <code>.env.example</code>).
        </p>
      )}
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
