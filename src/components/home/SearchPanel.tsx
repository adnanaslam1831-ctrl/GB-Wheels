"use client";

import Link from "next/link";
import { useState } from "react";
import { CarFront, ChevronDown, Coins, MapPin, PlusCircle, Search, Zap } from "lucide-react";
import { brands, districts } from "@/config/site";

const prices = [
  { label: "Any price", min: "", max: "" },
  { label: "Under PKR 10 lakh", min: "", max: "1000000" },
  { label: "PKR 10 - 20 lakh", min: "1000000", max: "2000000" },
  { label: "PKR 20 - 40 lakh", min: "2000000", max: "4000000" },
  { label: "PKR 40 - 80 lakh", min: "4000000", max: "8000000" },
  { label: "Above PKR 80 lakh", min: "8000000", max: "" },
];

function Select({ id, name, label, icon, children, ...rest }: React.SelectHTMLAttributes<HTMLSelectElement> & { icon: React.ReactNode; label: string }) {
  return (
    <div className="field-light relative !gap-1.5 !px-2.5 sm:!gap-2 sm:!px-3">
      <span className="shrink-0 [&>svg]:size-3.5 sm:[&>svg]:size-4">{icon}</span>
      <label htmlFor={id} className="sr-only">{label}</label>
      <select id={id} name={name} {...rest}>{children}</select>
      <ChevronDown aria-hidden className="pointer-events-none absolute right-2 size-3.5 sm:right-3 sm:size-4" />
    </div>
  );
}

export function SearchPanel({ models }: { models: Record<string, string[]> }) {
  const [brand, setBrand] = useState("");
  const [price, setPrice] = useState(0);
  const modelOptions = brand ? models[brand] ?? [] : [];
  const p = prices[price];

  return (
    <form action="/buy" method="get" className="relative z-10 mx-auto mt-5 max-w-6xl lg:mt-6">
      <div className="relative rounded-xl border border-accent/40 bg-gradient-to-b from-surface to-bg p-4 pb-5 shadow-[0_10px_40px_rgba(0,0,0,0.5)] sm:p-5 lg:pb-9">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-3 font-display text-xl font-semibold text-white sm:text-2xl">
            <Search className="size-6 text-accent" aria-hidden /> Find Your Car
          </h2>
          <span className="flex items-center gap-1 text-xs text-fg/90"><Zap className="size-3.5 fill-accent text-accent" aria-hidden />Quick Search</span>
        </div>

        <input type="hidden" name="minPrice" value={p.min} disabled={!p.min} />
        <input type="hidden" name="maxPrice" value={p.max} disabled={!p.max} />

        <div className="grid grid-cols-[1fr_1fr_1.25fr] gap-2 sm:gap-3 lg:grid-cols-[1fr_1fr_1fr_1fr_1fr]">
          <Select id="hp-brand" name="brand" label="Brand" icon={<CarFront className="size-4" aria-hidden />} value={brand} onChange={(e) => setBrand(e.target.value)}>
            <option value="">Brand</option>
            {brands.map((b) => <option key={b} value={b}>{b}</option>)}
          </Select>
          <Select id="hp-model" name="model" label="Model" icon={<CarFront className="size-4" aria-hidden />} disabled={!brand || modelOptions.length === 0}>
            <option value="">Model</option>
            {modelOptions.map((m) => <option key={m} value={m}>{m}</option>)}
          </Select>
          <div className="hidden lg:block">
            <Select id="hp-price" label="Price range" icon={<Coins className="size-4" aria-hidden />} value={price} onChange={(e) => setPrice(Number(e.target.value))}>
              {prices.map((x, i) => <option key={x.label} value={i}>{i === 0 ? "Price Range" : x.label}</option>)}
            </Select>
          </div>
          <Select id="hp-district" name="district" label="Location" icon={<MapPin className="size-4" aria-hidden />}>
            <option value="">Location</option>
            {districts.map((d) => <option key={d} value={d}>{d}</option>)}
          </Select>
          <button type="submit" className="red-glow col-span-3 flex min-h-11 items-center justify-center gap-2 rounded-md bg-gradient-to-b from-[#ff2a3f] to-[#c10a1d] text-sm font-semibold text-white lg:col-span-1">
            <Search className="size-4" aria-hidden /> <span className="lg:hidden">Search Cars</span><span className="hidden lg:inline">Search</span>
          </button>
        </div>

        {/* Mobile: outlined button inside the panel */}
        <Link href="/sell" className="mt-3 flex min-h-11 items-center justify-center gap-2 rounded-md border border-accent/70 text-sm font-semibold text-white lg:hidden">
          <PlusCircle className="size-5" aria-hidden /> Sell Your Car Free
        </Link>
      </div>

      {/* Desktop: red pill straddling the panel edge */}
      <div className="relative z-10 -mt-5 hidden items-center justify-center gap-0 lg:flex">
        <span aria-hidden className="h-px w-1/4 bg-gradient-to-r from-transparent to-accent/70" />
        <Link href="/sell" className="red-glow mx-2 flex min-h-11 items-center gap-2 rounded-full bg-gradient-to-b from-[#ff2a3f] to-[#c10a1d] px-8 text-sm font-semibold text-white">
          <PlusCircle className="size-5" aria-hidden /> Sell Your Car Free
        </Link>
        <span aria-hidden className="h-px w-1/4 bg-gradient-to-l from-transparent to-accent/70" />
      </div>
    </form>
  );
}
