"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { CarIllustration } from "@/components/ui/CarIllustration";
import type { VehicleWithImage } from "@/types/db";

/** "Recently Added" thumbnail strip with prev/next buttons. Real listings only. */
export function RecentCarousel({ items }: { items: VehicleWithImage[] }) {
  const ref = useRef<HTMLUListElement>(null);
  if (!items.length) return null;
  const scroll = (d: number) => ref.current?.scrollBy({ left: d * (ref.current.clientWidth * 0.8), behavior: "smooth" });
  const btn = "grid size-9 shrink-0 place-items-center rounded-full border border-fg/70 text-white transition hover:border-accent hover:bg-accent";
  return (
    <section className="border-t border-border bg-bg py-6">
      <div className="container-gb">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="section-title !text-xl">Recently <em>Added</em></h2>
          <Link href="/buy" className="flex items-center gap-2 text-xs font-medium hover:text-accent">View More <ArrowRight className="size-4" /></Link>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" aria-label="Previous" onClick={() => scroll(-1)} className={btn}><ArrowLeft className="size-4" /></button>
          <ul ref={ref} className="flex flex-1 snap-x gap-3 overflow-x-auto scroll-smooth [scrollbar-width:none]">
            {items.map((v) => (
              <li key={v.id} className="w-[44%] shrink-0 snap-start sm:w-[22%] lg:w-[15.5%]">
                <Link href={`/cars/${v.slug}`} className="relative block aspect-[16/9] overflow-hidden rounded-lg border border-border bg-surface-2 transition hover:border-accent" title={`${v.brand} ${v.model} ${v.model_year}`}>
                  {v.cover_url ? (
                    <Image src={v.cover_url} alt={`${v.brand} ${v.model} ${v.model_year}`} fill sizes="(min-width:1024px) 15vw, 44vw" className="object-cover" />
                  ) : (
                    <div className="grid h-full place-items-center p-2"><CarIllustration body="sedan" color="#2b2f38" className="w-full opacity-90" /></div>
                  )}
                </Link>
              </li>
            ))}
          </ul>
          <button type="button" aria-label="Next" onClick={() => scroll(1)} className={btn}><ArrowRight className="size-4" /></button>
        </div>
      </div>
    </section>
  );
}
