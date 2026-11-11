"use client";

import Link from "next/link";
import { useState } from "react";
import { Search } from "lucide-react";
import { brands, districts } from "@/config/site";

export function SearchPanel({ models }: { models: Record<string, string[]> }) {
  const [brand, setBrand] = useState("");
  const modelOptions = brand ? models[brand] ?? [] : [];

  return (
    <form action="/buy" method="get" className="glass-card relative z-10 mx-auto mt-6 max-w-5xl p-4 sm:p-6">
      <h2 className="mb-4 font-display text-xl font-semibold uppercase tracking-wide">Find Your Car</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto]">
        <div>
          <label htmlFor="hp-brand" className="sr-only">Brand</label>
          <select id="hp-brand" name="brand" value={brand} onChange={(e) => setBrand(e.target.value)} className="input">
            <option value="">All Brands</option>
            {brands.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="hp-model" className="sr-only">Model</label>
          <select id="hp-model" name="model" disabled={!brand || modelOptions.length === 0} className="input disabled:opacity-60">
            <option value="">{brand ? "All Models" : "Select brand first"}</option>
            {modelOptions.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="hp-district" className="sr-only">Location</label>
          <select id="hp-district" name="district" className="input">
            <option value="">All Locations</option>
            {districts.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <button type="submit" className="btn-primary sm:col-span-2 lg:col-span-1">
          <Search className="size-4" /> Search Cars
        </button>
      </div>
      <div className="mt-3">
        <Link href="/sell" className="btn-outline w-full sm:w-auto">Sell Your Car Free</Link>
      </div>
    </form>
  );
}
