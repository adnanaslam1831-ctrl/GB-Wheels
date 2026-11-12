import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { CarIllustration } from "@/components/ui/CarIllustration";
import { FavoriteButton } from "./FavoriteButton";
import { formatMileage, formatPKR } from "@/lib/utils";
import type { VehicleWithImage } from "@/types/db";

export function VehicleCard({ v, saved = false }: { v: VehicleWithImage; saved?: boolean }) {
  const title = `${v.brand} ${v.model}${v.variant ? " " + v.variant : ""}`;
  const suv = /cruiser|prado|fortuner|vezel|jimny|tucson|sportage|pajero|rush|harrier/i.test(v.model);
  const engine = v.engine_cc ? `${(v.engine_cc / 1000).toFixed(1)}L` : null;
  const specs = [engine, v.transmission, v.mileage_km != null ? formatMileage(v.mileage_km) : null].filter(Boolean) as string[];
  return (
    <article className="group overflow-hidden rounded-xl border border-border bg-surface shadow-[0_8px_30px_rgba(0,0,0,0.35)] transition duration-300 hover:-translate-y-1 hover:border-accent/60">
      <div className="relative aspect-[16/9] overflow-hidden bg-surface-2">
        <Link href={`/cars/${v.slug}`} aria-label={`View ${title}`} className="absolute inset-0">
          {v.cover_url ? (
            <Image
              src={v.cover_url}
              alt={`${title} ${v.model_year} for sale in ${v.district}`}
              fill
              sizes="(min-width:1024px) 33vw, 50vw"
              className="object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="grid h-full place-items-center bg-[radial-gradient(70%_70%_at_50%_60%,#1d2028,#0c0e13)] p-4">
              <CarIllustration body={suv ? "suv" : "sedan"} color="#2b2f38" className="w-full max-w-[220px] opacity-90" />
            </div>
          )}
        </Link>
        <div className="pointer-events-none absolute left-2 top-2 flex flex-wrap gap-1.5">
          {v.is_featured && <span className="rounded-md bg-accent px-2.5 py-1 text-xs font-semibold text-white">Featured</span>}
          {v.is_demo && <span className="rounded-md bg-amber-500 px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-black">Demo</span>}
          {v.status === "reserved" && <span className="rounded-md bg-black/70 px-2 py-1 text-[11px] font-semibold uppercase text-white">Reserved</span>}
        </div>
        <FavoriteButton vehicleId={v.id} initialSaved={saved} className="absolute right-2 top-2" />
      </div>

      <div className="p-3 sm:p-4">
        <h3 className="line-clamp-1 text-[15px] font-semibold sm:text-base">{v.brand} {v.model}{v.variant ? ` ${v.variant}` : ""} {v.model_year}</h3>
        <p className="mt-1 flex items-center gap-1 text-xs text-fg/80">
          <MapPin className="size-3.5 text-accent" /> {v.district}{v.town ? `, ${v.town}` : ""}
        </p>
        <p className="mt-1 truncate whitespace-nowrap text-[10px] text-fg/90 sm:text-xs">{specs.join(" | ") || "Details on request"}</p>
        <div className="mt-2 flex items-center justify-between gap-2">
          <p className="text-lg font-bold text-accent sm:text-xl">{formatPKR(v.advertised_price)}</p>
          <Link href={`/cars/${v.slug}`} aria-label={`View details of ${title}`} className="grid size-9 place-items-center rounded-full border border-fg/70 text-white transition hover:border-accent hover:bg-accent">
            <ArrowRight className="size-4" />
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
