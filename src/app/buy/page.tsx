import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { VehicleCard } from "@/components/vehicles/VehicleCard";
import { FilterForm } from "@/components/vehicles/FilterForm";
import { FilterDrawer } from "@/components/vehicles/FilterDrawer";
import { SortSelect } from "@/components/vehicles/SortSelect";
import { ConfigNotice, EmptyState } from "@/components/ui/ConfigNotice";
import { PAGE_SIZE, getFilterOptions, getSavedIds, mergeModels, parseFilters, searchVehicles } from "@/lib/data/vehicles";
import { buildQuery, one, type SP } from "@/lib/query";

export const metadata: Metadata = {
  title: "Buy Cars in Gilgit-Baltistan",
  description: "Browse cars for sale in Gilgit, Skardu, Hunza, Ghizer, Nagar, Astore, Diamer and Ghanche. Filter by brand, price, year and more.",
};
export const dynamic = "force-dynamic";

const FILTER_KEYS = ["q","brand","model","variant","minPrice","maxPrice","minYear","maxYear","district","fuel","transmission","minCc","maxCc","maxMileage","condition","registration","customs"];

export default async function BuyPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const f = parseFilters(sp);
  const flat: Record<string, string | undefined> = {};
  [...FILTER_KEYS, "sort"].forEach((k) => (flat[k] = one(sp[k])));

  const [{ vehicles, total, error }, options, saved] = await Promise.all([searchVehicles(f), getFilterOptions(), getSavedIds()]);
  const models = mergeModels(options.models);
  const active = FILTER_KEYS.filter((k) => flat[k]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const link = (page: number) => `/buy${buildQuery(flat, { page: page > 1 ? String(page) : undefined })}`;

  const first = Math.max(1, f.page - 2);
  const pageNumbers = Array.from({ length: Math.min(5, pages - first + 1) }, (_, i) => first + i);

  return (
    <div className="container-gb py-8">
      <h1 className="font-display text-3xl font-semibold uppercase sm:text-4xl">Buy Cars</h1>
      <p className="mt-1 text-sm text-muted">Cars for sale across Gilgit-Baltistan. No account needed to browse.</p>
      <ConfigNotice className="mt-4" />

      <div className="mt-6 grid gap-8 lg:grid-cols-[280px_1fr]">
        <aside className="hidden lg:block">
          <div className="glass-card sticky top-20 max-h-[calc(100dvh-6rem)] overflow-y-auto p-4">
            <h2 className="mb-4 font-display text-lg uppercase tracking-wide">Filters</h2>
            <FilterForm f={f} models={models} idPrefix="d" />
          </div>
        </aside>

        <section>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted" aria-live="polite">
              <span className="font-semibold text-white">{total}</span> {total === 1 ? "car" : "cars"} found
            </p>
            <div className="flex items-center gap-3">
              <FilterDrawer activeCount={active.length}><FilterForm f={f} models={models} idPrefix="m" /></FilterDrawer>
              <Suspense fallback={null}><SortSelect value={f.sort} /></Suspense>
            </div>
          </div>

          {active.length > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {active.map((k) => (
                <Link key={k} href={`/buy${buildQuery(flat, { [k]: undefined, page: undefined })}`}
                  className="flex items-center gap-1 rounded-full border border-border bg-surface px-3 py-1 text-xs hover:border-accent">
                  {k}: {flat[k]} <X className="size-3" />
                </Link>
              ))}
              <Link href="/buy" className="text-xs text-accent hover:underline">Clear all</Link>
            </div>
          )}

          {error ? (
            <EmptyState title="Could not load cars" body="Something went wrong talking to the database. Please try again shortly." />
          ) : vehicles.length === 0 ? (
            <EmptyState
              title={active.length ? "No cars match these filters" : "No cars listed yet"}
              body={active.length ? "Try removing a filter or widening your price range." : "Approved listings will appear here."}
              action={active.length ? <Link href="/buy" className="btn-primary">Clear filters</Link> : <Link href="/sell" className="btn-primary">Sell Your Car</Link>}
            />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3">
              {vehicles.map((v) => <VehicleCard key={v.id} v={v} saved={saved.has(v.id)} />)}
            </div>
          )}

          {pages > 1 && (
            <nav aria-label="Pagination" className="mt-8 flex items-center justify-center gap-1">
              {f.page > 1 && <Link href={link(f.page - 1)} className="btn-outline !px-3" aria-label="Previous page"><ChevronLeft className="size-4" /></Link>}
              {pageNumbers.map((n) => (
                <Link key={n} href={link(n)} aria-current={n === f.page ? "page" : undefined}
                  className={n === f.page ? "btn-primary !px-4" : "btn-outline !px-4"}>{n}</Link>
              ))}
              {f.page < pages && <Link href={link(f.page + 1)} className="btn-outline !px-3" aria-label="Next page"><ChevronRight className="size-4" /></Link>}
            </nav>
          )}
        </section>
      </div>
    </div>
  );
}
