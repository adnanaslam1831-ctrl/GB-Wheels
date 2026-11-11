import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, CircleDashed, MapPin } from "lucide-react";
import { Gallery } from "@/components/vehicles/Gallery";
import { ContactPanel } from "@/components/vehicles/ContactPanel";
import { VehicleCard } from "@/components/vehicles/VehicleCard";
import { getSavedIds, getSimilarVehicles, getVehicleBySlug, getVehicleImages } from "@/lib/data/vehicles";
import { getSupabase } from "@/lib/supabase/server";
import { contactReady, siteConfig } from "@/config/site";
import { customsLabels, formatDate, formatMileage, formatPKR, registrationLabels } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const v = await getVehicleBySlug(slug);
  if (!v) return { title: "Car not found", robots: { index: false } };
  const title = `${v.brand} ${v.model} ${v.model_year} for sale in ${v.district}`;
  const description = `${title}. ${formatPKR(v.advertised_price)}, ${formatMileage(v.mileage_km)}, ${v.transmission ?? ""} ${v.fuel_type ?? ""}. Listed on GB Wheels.`.replace(/\s+/g, " ");
  const images = await getVehicleImages(v.id);
  return {
    title, description,
    alternates: { canonical: `/cars/${v.slug}` },
    openGraph: { title, description, type: "website", images: images[0] ? [images[0].url] : undefined },
  };
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border/60 py-2.5 text-sm">
      <dt className="text-muted">{k}</dt>
      <dd className="text-right font-medium">{v || "N/A"}</dd>
    </div>
  );
}

function Check({ done, label, detail }: { done: boolean; label: string; detail: string }) {
  return (
    <li className="flex items-start gap-3 py-2">
      {done ? <BadgeCheck className="mt-0.5 size-5 shrink-0 text-emerald-400" /> : <CircleDashed className="mt-0.5 size-5 shrink-0 text-muted" />}
      <div>
        <p className="text-sm font-medium">{label}{done ? "" : " (not yet done)"}</p>
        <p className="text-xs text-muted">{detail}</p>
      </div>
    </li>
  );
}

export default async function CarPage({ params }: Props) {
  const { slug } = await params;
  const v = await getVehicleBySlug(slug);
  if (!v) notFound();

  const [images, similar, saved] = await Promise.all([getVehicleImages(v.id), getSimilarVehicles(v), getSavedIds()]);
  // Best-effort view counter (security-definer function; only counts public listings).
  const supabase = await getSupabase();
  await supabase?.rpc("increment_vehicle_views", { p_vehicle: v.id });

  const title = `${v.brand} ${v.model}${v.variant ? " " + v.variant : ""} ${v.model_year}`;
  const unavailable = v.status === "sold";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Car",
    name: title,
    brand: { "@type": "Brand", name: v.brand },
    model: v.model,
    vehicleModelDate: String(v.model_year),
    mileageFromOdometer: v.mileage_km ? { "@type": "QuantitativeValue", value: v.mileage_km, unitCode: "KMT" } : undefined,
    fuelType: v.fuel_type ?? undefined,
    vehicleTransmission: v.transmission ?? undefined,
    color: v.color ?? undefined,
    image: images.map((i) => i.url),
    url: `${siteConfig.url}/cars/${v.slug}`,
    offers: {
      "@type": "Offer",
      price: v.advertised_price,
      priceCurrency: "PKR",
      availability: unavailable ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
    },
  };

  return (
    <div className="container-gb py-6 sm:py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav aria-label="Breadcrumb" className="mb-4 text-xs text-muted">
        <Link href="/" className="hover:text-white">Home</Link> / <Link href="/buy" className="hover:text-white">Buy Cars</Link> / <span className="text-fg">{v.brand} {v.model}</span>
      </nav>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px] lg:gap-8">
        <div className="min-w-0 space-y-8">
          <Gallery images={images} title={title} />

          <header>
            <div className="flex flex-wrap gap-2">
              {v.is_featured && <span className="rounded bg-accent px-2 py-0.5 text-xs font-bold uppercase">Featured</span>}
              {v.is_demo && <span className="rounded bg-amber-500 px-2 py-0.5 text-xs font-bold uppercase text-black">Demo listing</span>}
              {v.status === "reserved" && <span className="rounded bg-surface-2 px-2 py-0.5 text-xs font-semibold uppercase">Reserved</span>}
              {unavailable && <span className="rounded bg-surface-2 px-2 py-0.5 text-xs font-semibold uppercase">Sold</span>}
            </div>
            <h1 className="mt-2 font-display text-3xl font-semibold uppercase leading-tight sm:text-4xl">{title}</h1>
            <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
              <span className="flex items-center gap-1"><MapPin className="size-4" />{v.district}{v.town ? `, ${v.town}` : ""}</span>
              <span>Ref {v.reference}</span>
              <span>Posted {formatDate(v.published_at ?? v.created_at)}</span>
            </p>
            <p className="mt-3 text-3xl font-bold text-accent">{formatPKR(v.advertised_price)}</p>
          </header>

          <section>
            <h2 className="section-title mb-3">Specifications</h2>
            <dl className="glass-card grid px-4 sm:grid-cols-2 sm:gap-x-10">
              <Row k="Brand" v={v.brand} /><Row k="Model" v={v.model} />
              <Row k="Variant" v={v.variant} /><Row k="Model year" v={v.model_year} />
              <Row k="Registration year" v={v.registration_year} />
              <Row k="Engine capacity" v={v.engine_cc ? `${v.engine_cc} cc` : null} />
              <Row k="Fuel type" v={v.fuel_type} /><Row k="Transmission" v={v.transmission} />
              <Row k="Mileage" v={formatMileage(v.mileage_km)} /><Row k="Colour" v={v.color} />
              <Row k="Overall condition" v={v.condition} />
              <Row k="Registration status" v={registrationLabels[v.registration_status]} />
              <Row k="Customs status" v={customsLabels[v.customs_status]} />
              <Row k="Steering" v={v.steering_side} /><Row k="Import origin" v={v.import_origin} />
            </dl>
          </section>

          <section>
            <h2 className="section-title mb-3">Seller&apos;s Description</h2>
            <div className="glass-card space-y-4 p-4 text-sm leading-relaxed">
              <p className="whitespace-pre-line">{v.description || "The seller has not added a description."}</p>
              {v.known_defects && (
                <div>
                  <h3 className="font-semibold text-white">Known defects</h3>
                  <p className="mt-1 whitespace-pre-line text-muted">{v.known_defects}</p>
                </div>
              )}
              <p className="text-xs text-muted">This information is declared by the seller.</p>
            </div>
          </section>

          <section>
            <h2 className="section-title mb-3">Verification</h2>
            <div className="glass-card p-4">
              <p className="text-sm text-muted">Badges appear only for checks GB Wheels has actually completed.</p>
              <ul className="mt-2 divide-y divide-border/60">
                <Check done label="Seller-declared information" detail="Specifications and condition were provided by the seller." />
                <Check done={v.docs_reviewed} label="Documents reviewed" detail="GB Wheels has looked at the vehicle's paperwork." />
                <Check done={v.gbw_inspected} label="GB Wheels inspection" detail="A GB Wheels representative has physically inspected the vehicle." />
                <Check done={v.independently_verified} label="Independently verified" detail="Key details were confirmed by an independent source." />
              </ul>
            </div>
          </section>
        </div>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          {unavailable ? (
            <div className="glass-card p-5 text-sm"><p className="font-semibold">This car has been sold.</p>
              <Link href="/buy" className="btn-primary mt-4 w-full">Browse similar cars</Link></div>
          ) : (
            <ContactPanel
              vehicleId={v.id} reference={v.reference} title={title} saved={saved.has(v.id)}
              whatsapp={contactReady.whatsapp ? siteConfig.contact.whatsapp : null}
              phone={contactReady.phone ? siteConfig.contact.phone : null}
            />
          )}
        </aside>
      </div>

      {similar.length > 0 && (
        <section className="mt-12">
          <h2 className="section-title mb-4">Similar Cars</h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {similar.map((s) => <VehicleCard key={s.id} v={s} saved={saved.has(s.id)} />)}
          </div>
        </section>
      )}
    </div>
  );
}
