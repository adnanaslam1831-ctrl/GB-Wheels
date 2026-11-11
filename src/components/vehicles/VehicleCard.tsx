import Image from "next/image";
import Link from "next/link";
import { Cog, Fuel, Gauge, MapPin } from "lucide-react";
import { CarIllustration } from "@/components/ui/CarIllustration";
import { FavoriteButton } from "./FavoriteButton";
import { formatMileage, formatPKR } from "@/lib/utils";
import type { VehicleWithImage } from "@/types/db";

export function VehicleCard({ v, saved = false }: { v: VehicleWithImage; saved?: boolean }) {
  const title = `${v.brand} ${v.model}${v.variant ? " " + v.variant : ""}`;
  const suv = /cruiser|prado|fortuner|vezel|jimny|tucson|sportage|pajero|rush|harrier/i.test(v.model);
  return (
    <article className="group glass-card overflow-hidden transition duration-300 hover:-translate-y-1 hover:border-accent/60">
      <div className="relative aspect-[4/3] overflow-hidden bg-surface-2">
        <Link href={`/cars/${v.slug}`} aria-label={`View ${title}`} className="absolute inset-0">
          {v.cover_url ? (
            <Image
              src={v.cover_url}
              alt={`${title} ${v.model_year} for sale in ${v.district}`}
              fill
              sizes="(min-width:1024px) 25vw, (min-width:640px) 33vw, 50vw"
              className="object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="grid h-full place-items-center bg-[radial-gradient(70%_70%_at_50%_60%,#1d2028,#0c0e13)] p-4">
              <CarIllustration body={suv ? "suv" : "sedan"} color="#2b2f38" className="w-full max-w-[260px] opacity-90" />
            </div>
          )}
        </Link>
        <div className="pointer-events-none absolute left-2 top-2 flex flex-wrap gap-1.5">
          {v.is_featured && <span className="rounded bg-accent px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">Featured</span>}
          {v.is_demo && <span className="rounded bg-amber-500 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-black">Demo</span>}
          {v.status === "reserved" && <span className="rounded bg-black/70 px-2 py-0.5 text-[11px] font-semibold uppercase text-white">Reserved</span>}
        </div>
        <FavoriteButton vehicleId={v.id} initialSaved={saved} className="absolute right-2 top-2" />
      </div>

      <div className="p-3 sm:p-4">
        <h3 className="line-clamp-1 font-display text-base font-medium uppercase tracking-wide sm:text-lg">
          {v.brand} {v.model} <span className="text-muted">{v.model_year}</span>
        </h3>
        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
          <MapPin className="size-3.5" /> {v.district}
          {v.town ? `, ${v.town}` : ""}
        </p>
        <ul className="mt-3 grid grid-cols-3 gap-1 text-[11px] text-muted sm:text-xs">
          <li className="flex items-center gap-1"><Gauge className="size-3.5 shrink-0 text-accent" />{formatMileage(v.mileage_km)}</li>
          <li className="flex items-center gap-1"><Fuel className="size-3.5 shrink-0 text-accent" />{v.engine_cc ? `${v.engine_cc} cc` : "N/A"}</li>
          <li className="flex items-center gap-1"><Cog className="size-3.5 shrink-0 text-accent" />{v.transmission ?? "N/A"}</li>
        </ul>
        <div className="mt-3 flex items-center justify-between gap-2">
          <p className="text-base font-bold text-white sm:text-lg">{formatPKR(v.advertised_price)}</p>
          <Link href={`/cars/${v.slug}`} className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold transition hover:border-accent hover:text-accent">
            View Details
          </Link>
        </div>
      </div>
    </article>
  );
}

export function VehicleCardSkeleton() {
  return (
    <div className="glass-card overflow-hidden">
      <div className="skeleton aspect-[4/3]" />
      <div className="space-y-3 p-4">
        <div className="skeleton h-5 w-3/4 rounded" />
        <div className="skeleton h-3 w-1/3 rounded" />
        <div className="skeleton h-3 w-full rounded" />
        <div className="skeleton h-6 w-1/2 rounded" />
      </div>
    </div>
  );
}
