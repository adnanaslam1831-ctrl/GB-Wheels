import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight, BadgeCheck, Camera, ClipboardCheck, Handshake, Headset, MapPin, MapPinned, MessageSquareText,
  ShieldCheck, UserRoundCheck, Zap,
} from "lucide-react";
import { BrandMark } from "@/components/ui/BrandMark";
import { districts } from "@/config/site";
import { testimonials } from "@/config/catalog";
import { Reveal } from "@/components/ui/Reveal";
import { VehicleCard } from "@/components/vehicles/VehicleCard";
import { EmptyState } from "@/components/ui/ConfigNotice";
import { isDbConfigured } from "@/lib/env";
import type { VehicleWithImage } from "@/types/db";

export function SectionHeader({ title, href, linkLabel = "View all" }: { title: React.ReactNode; href?: string; linkLabel?: string }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <h2 className="section-title">{title}</h2>
      {href && (
        <Link href={href} className="flex items-center gap-2 text-xs font-medium text-fg hover:text-accent sm:text-sm">
          {linkLabel} <ArrowRight className="size-4" />
        </Link>
      )}
    </div>
  );
}

const homeBrands = ["Toyota", "Honda", "Suzuki", "Nissan", "Daihatsu", "Mitsubishi", "Other"] as const;

export function BrandGrid({ counts }: { counts: Record<string, number> }) {
  return (
    <section className="container-gb py-8 sm:py-10">
      <SectionHeader title={<>Browse by <em>Brand</em></>} href="/buy" linkLabel="View All Brands" />
      <div className="-mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-7 sm:gap-3 sm:overflow-visible sm:px-0 [scrollbar-width:none]">
        {homeBrands.map((b, i) => (
          <Reveal key={b} delay={i * 0.03} className="min-w-[88px] flex-1 sm:min-w-0">
            <Link
              href={b === "Other" ? "/buy?brand=Other" : `/buy?brand=${encodeURIComponent(b)}`}
              className="flex h-[84px] flex-col items-center justify-center gap-1.5 rounded-xl border border-border bg-gradient-to-b from-surface-2 to-surface text-center text-xs font-medium shadow-[0_6px_20px_rgba(0,0,0,0.35)] transition hover:-translate-y-1 hover:border-accent sm:h-[96px] sm:text-sm"
            >
              <BrandMark brand={b} className={b === "Other" ? "h-4 w-9" : "size-8 sm:size-9"} />
              <span>{b}</span>
              {counts[b] ? <span className="sr-only">{counts[b]} cars</span> : null}
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

export function VehicleGridSection({
  title, vehicles, saved, href, emptyBody, sample = false, cols = 4,
}: { title: React.ReactNode; vehicles: VehicleWithImage[]; saved: Set<string>; href?: string; emptyBody?: string; sample?: boolean; cols?: 3 | 4 }) {
  return (
    <section className="container-gb py-8 sm:py-10">
      <SectionHeader title={title} href={href} linkLabel="View All Listings" />
      {vehicles.length ? (
        <div className={`grid grid-cols-2 gap-3 sm:gap-5 ${cols === 3 ? "lg:grid-cols-3" : "lg:grid-cols-4"}`}>
          {vehicles.map((v, i) => (
            <Reveal key={v.id} delay={(i % 4) * 0.05}><VehicleCard v={v} saved={saved.has(v.id)} /></Reveal>
          ))}
        </div>
      ) : sample ? (
        <SampleCars connected={isDbConfigured} />
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

const samples = [
  { name: "Toyota Crown 2022", city: "Gilgit", specs: "2.5L | Automatic | 45,000 km", price: "Rs 7,950,000", img: "/photos/crown.jpg", featured: true },
  { name: "Toyota Land Cruiser 300", city: "Skardu", specs: "3.5L | Automatic | 20,000 km", price: "Rs 26,500,000", img: "/photos/land-cruiser.jpg" },
  { name: "Toyota Corolla GLI Grande", city: "Gilgit", specs: "1.8L | Automatic | 70,000 km", price: "Rs 5,200,000", img: "/photos/corolla.jpg" },
];

/** Shown only while there are no approved listings. Clearly labelled; not real cars and not for sale. */
function SampleCars({ connected }: { connected: boolean }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
        {samples.map((c, i) => (
          <article key={c.name} className={`overflow-hidden rounded-xl border border-border bg-surface shadow-[0_8px_30px_rgba(0,0,0,0.35)] ${i === 2 ? "hidden lg:block" : ""}`}>
            <div className="relative aspect-[16/9]">
              <Image src={c.img} alt={`${c.name} (sample image)`} fill sizes="(min-width:1024px) 33vw, 50vw" className="object-cover" />
              <div className="absolute left-2 top-2 flex gap-1.5">
                {c.featured && <span className="rounded-md bg-accent px-2.5 py-1 text-xs font-semibold text-white">Featured</span>}
                <span className="rounded-md bg-amber-500 px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-black">Sample</span>
              </div>
            </div>
            <div className="p-3 sm:p-4">
              <h3 className="line-clamp-1 text-[15px] font-semibold sm:text-base">{c.name}</h3>
              <p className="mt-1 flex items-center gap-1 text-xs text-fg/80"><MapPin className="size-3.5 text-accent" />{c.city}</p>
              <p className="mt-1 truncate whitespace-nowrap text-[10px] text-fg/90 sm:text-xs">{c.specs}</p>
              <p className="mt-2 text-lg font-bold text-accent sm:text-xl">{c.price}</p>
            </div>
          </article>
        ))}
      </div>
      <p className="mt-3 text-center text-xs text-muted">
        Sample cars shown for illustration only, not for sale.{" "}
        {connected ? "Approved listings will replace them." : "Connect the database to show live listings."}{" "}
        <Link href="/sell" className="text-accent hover:underline">List your car</Link>
      </p>
    </>
  );
}

const why = [
  { icon: ShieldCheck, title: "Trusted Platform", body: "Reviewed Listings" },
  { icon: Handshake, title: "Local Support", body: "Across GB" },
  { icon: Zap, title: "Fast & Easy", body: "Process" },
  { icon: Headset, title: "Dedicated Support", body: "Always Here" },
];

export function WhyChoose() {
  return (
    <section className="mt-6 border-y border-border bg-gradient-to-b from-surface/70 to-bg">
      <div className="container-gb grid gap-6 py-8 lg:grid-cols-[1.25fr_1fr] lg:items-center lg:gap-10">
        <div>
          <h2 className="section-title mb-5">Why Choose <em>GBWheels?</em></h2>
          <ul className="grid grid-cols-4 gap-1 rounded-xl border border-border bg-surface/60 py-4 sm:border-0 sm:bg-transparent sm:py-0">
            {why.map((w) => (
              <li key={w.title} className="flex flex-col items-center px-1 text-center [&:not(:last-child)]:border-r [&:not(:last-child)]:border-border sm:border-0">
                <w.icon className="mb-2 size-8 text-accent drop-shadow-[0_0_10px_rgba(237,16,38,0.5)] sm:size-10" strokeWidth={1.6} aria-hidden />
                <p className="text-[11px] font-semibold leading-tight text-white sm:text-sm">{w.title}</p>
                <p className="text-[10px] text-fg/80 sm:text-xs">{w.body}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className="relative isolate min-h-[150px] overflow-hidden rounded-xl border border-accent/40 sm:min-h-[190px]">
          <Image src="/photos/banner.jpg" alt="" aria-hidden fill sizes="(min-width:1024px) 40vw, 100vw" className="-z-20 object-cover object-right" />
          <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-r from-bg via-bg/80 to-transparent" />
          <div className="flex h-full min-h-[inherit] flex-col justify-center p-5 sm:p-7">
            <h3 className="max-w-[16rem] font-display text-xl font-bold italic leading-tight sm:text-2xl">Your Trusted Car Marketplace in Gilgit Baltistan</h3>
            <Link href="/about" className="red-glow mt-4 inline-flex w-fit items-center gap-2 rounded-full bg-gradient-to-b from-[#ff2a3f] to-[#c10a1d] px-5 py-2 text-sm font-semibold text-white">
              Learn More <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export function DistrictGrid({ counts }: { counts: Record<string, number> }) {
  return (
    <section className="container-gb py-12">
      <SectionHeader title={<>Browse by <em>District</em></>} />
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
        <SectionHeader title={<>How GB Wheels <em>Works</em></>} />
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
            <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Too busy to sell? We&apos;ll sell it for you.</h2>
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

export function Testimonials() {
  if (!testimonials.length) return null; // only real, permitted testimonials are ever shown
  return (
    <section className="container-gb py-12">
      <SectionHeader title={<>What Customers <em>Say</em></>} />
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

/** Kept for the About and Sell pages: the same "Why choose" band as the homepage. */
export function TrustSection(_props: { title?: string }) {
  void _props;
  return <WhyChoose />;
}
