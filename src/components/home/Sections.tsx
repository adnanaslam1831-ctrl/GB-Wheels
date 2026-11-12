import Link from "next/link";
import {
  ArrowRight, BadgeCheck, Camera, ClipboardCheck, Headphones, MapPinned, MessageSquareText,
  ShieldCheck, Timer, UserRoundCheck,
} from "lucide-react";
import { brands, districts, siteConfig } from "@/config/site";
import { testimonials } from "@/config/catalog";
import { Reveal } from "@/components/ui/Reveal";
import { VehicleCard } from "@/components/vehicles/VehicleCard";
import { EmptyState } from "@/components/ui/ConfigNotice";
import { isDbConfigured } from "@/lib/env";
import type { VehicleWithImage } from "@/types/db";

export function SectionHeader({ title, href, linkLabel = "View all" }: { title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <h2 className="section-title">{title}<span className="mt-2 block h-0.5 w-12 bg-accent" /></h2>
      {href && (
        <Link href={href} className="flex items-center gap-1 text-sm font-semibold text-accent hover:underline">
          {linkLabel} <ArrowRight className="size-4" />
        </Link>
      )}
    </div>
  );
}

export function BrandGrid({ counts }: { counts: Record<string, number> }) {
  return (
    <section className="container-gb py-12">
      <SectionHeader title="Browse by Brand" />
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-9">
        {brands.map((b, i) => (
          <Reveal key={b} delay={i * 0.03}>
            <Link
              href={`/buy?brand=${encodeURIComponent(b)}`}
              className="glass-card group flex aspect-square flex-col items-center justify-center gap-1 p-2 text-center transition hover:-translate-y-1 hover:border-accent"
            >
              <span className="grid size-11 place-items-center rounded-full border border-border bg-bg font-display text-lg font-semibold text-white transition group-hover:border-accent group-hover:text-accent">
                {b.charAt(0)}
              </span>
              <span className="text-xs font-semibold">{b}</span>
              {counts[b] ? <span className="text-[10px] text-muted">{counts[b]} cars</span> : null}
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

export function VehicleGridSection({
  title, vehicles, saved, href, emptyBody,
}: { title: string; vehicles: VehicleWithImage[]; saved: Set<string>; href?: string; emptyBody?: string }) {
  return (
    <section className="container-gb py-10">
      <SectionHeader title={title} href={vehicles.length ? href : undefined} />
      {vehicles.length ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {vehicles.map((v, i) => (
            <Reveal key={v.id} delay={(i % 4) * 0.05}><VehicleCard v={v} saved={saved.has(v.id)} /></Reveal>
          ))}
        </div>
      ) : (
        <EmptyState
          title={isDbConfigured ? "No cars listed yet" : "Database not connected"}
          body={emptyBody ?? (isDbConfigured
            ? "Approved listings will appear here. Be the first to list your car."
            : "Connect the database to show live listings here.")}
          action={<Link href="/sell" className="btn-primary">Sell Your Car</Link>}
        />
      )}
    </section>
  );
}

export function DistrictGrid({ counts }: { counts: Record<string, number> }) {
  return (
    <section className="container-gb py-12">
      <SectionHeader title="Browse by District" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {districts.map((d) => (
          <Link key={d} href={`/buy?district=${d}`} className="glass-card group flex items-center justify-between p-4 transition hover:border-accent">
            <span className="flex items-center gap-2 font-medium"><MapPinned className="size-4 text-accent" />{d}</span>
            <span className="text-xs text-muted">{counts[d] ?? 0}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

const steps = [
  { icon: Camera, title: "List your car", body: "Create an account and submit your vehicle with photos and details." },
  { icon: ClipboardCheck, title: "We review it", body: "GB Wheels checks every listing before it goes live on the marketplace." },
  { icon: MessageSquareText, title: "Buyers enquire", body: "Interested buyers contact GB Wheels, so your number stays private." },
  { icon: UserRoundCheck, title: "Close the deal", body: "Arrange viewings and complete the sale, with our help if you choose a managed sale." },
];

export function HowItWorks() {
  return (
    <section className="border-y border-border bg-surface/60 py-14">
      <div className="container-gb">
        <SectionHeader title="How GB Wheels Works" />
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <Reveal key={s.title} delay={i * 0.06}>
              <li className="glass-card h-full p-5">
                <div className="mb-3 flex items-center justify-between">
                  <s.icon className="size-7 text-accent" />
                  <span className="font-display text-3xl text-border">0{i + 1}</span>
                </div>
                <h3 className="font-display text-lg uppercase tracking-wide">{s.title}</h3>
                <p className="mt-1 text-sm text-muted">{s.body}</p>
              </li>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function ManagedPromo() {
  return (
    <section className="container-gb py-14">
      <div className="relative overflow-hidden rounded-lg border border-accent/40 bg-gradient-to-br from-[#1a0a0d] via-surface to-bg p-6 sm:p-10">
        <div aria-hidden className="absolute -right-20 -top-20 size-72 rounded-full bg-accent/20 blur-3xl" />
        <div className="relative grid items-center gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-accent">Managed Sale</p>
            <h2 className="mt-2 font-display text-3xl font-semibold uppercase sm:text-4xl">Too busy to sell? We&apos;ll sell it for you.</h2>
            <p className="mt-3 max-w-xl text-muted">
              GB Wheels photographs your car, writes the listing, promotes it, handles enquiries, arranges viewings and helps negotiate.
              You see the brokerage fee and advertised price up front and must agree before anything goes live.
            </p>
            <Link href="/managed-sale" className="btn-primary mt-6">Request a Managed Sale <ArrowRight className="size-4" /></Link>
          </div>
          <ul className="grid gap-2 text-sm">
            {["Professional photography", "Listing written for you", "Social media promotion", "Enquiries and viewings handled", "Negotiation support"].map((t) => (
              <li key={t} className="flex items-center gap-2"><BadgeCheck className="size-4 shrink-0 text-accent" />{t}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

const trust = [
  { icon: ShieldCheck, title: "Trusted Platform", body: "Every listing is reviewed. Verification badges appear only after checks are actually done." },
  { icon: MapPinned, title: "Local Support Across GB", body: "From Gilgit to Skardu, Hunza to Diamer, we know the region." },
  { icon: Timer, title: "Fast & Easy Process", body: "List in minutes, or let us handle everything." },
  { icon: Headphones, title: "Dedicated Customer Support", body: "Reach us by phone, WhatsApp or email." },
];

export function TrustSection({ title = "Why Choose GB Wheels" }: { title?: string }) {
  return (
    <section className="container-gb py-12">
      <SectionHeader title={title} />
      <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
        {trust.map((t, i) => (
          <Reveal key={t.title} delay={i * 0.05}>
            <div className="glass-card h-full p-4 sm:p-5">
              <t.icon className="mb-3 size-7 text-accent" />
              <h3 className="font-display text-base uppercase tracking-wide sm:text-lg">{t.title}</h3>
              <p className="mt-1 text-xs text-muted sm:text-sm">{t.body}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

export function PromoBanner() {
  return (
    <section className="container-gb pb-12">
      <div className="relative isolate overflow-hidden rounded-lg border border-border bg-surface px-6 py-14 text-center sm:py-20">
        <svg aria-hidden viewBox="0 0 800 200" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 -z-10 h-full w-full opacity-60">
          <polygon fill="#161920" points="0,200 0,120 100,60 170,110 280,20 380,100 470,50 570,120 670,40 800,100 800,200" />
          <polygon fill="#0d0f14" points="0,200 0,160 140,110 260,150 400,90 540,150 680,100 800,150 800,200" />
        </svg>
        <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(60%_80%_at_50%_100%,rgba(237,16,38,0.25),transparent)]" />
        <h2 className="mx-auto max-w-2xl font-display text-3xl font-semibold uppercase sm:text-4xl">
          Your Trusted Car Marketplace in <span className="text-accent">Gilgit-Baltistan</span>
        </h2>
        <p className="mt-2 text-sm text-muted">{siteConfig.tagline}</p>
        <Link href="/about" className="btn-primary mt-6">Learn More</Link>
      </div>
    </section>
  );
}

export function Testimonials() {
  if (!testimonials.length) return null; // only real, permitted testimonials are ever shown
  return (
    <section className="container-gb py-12">
      <SectionHeader title="What Customers Say" />
      <div className="grid gap-4 md:grid-cols-3">
        {testimonials.map((t) => (
          <figure key={t.name} className="glass-card p-5">
            <blockquote className="text-sm text-fg/90">&ldquo;{t.quote}&rdquo;</blockquote>
            <figcaption className="mt-3 text-xs text-muted">{t.name}, {t.location}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
