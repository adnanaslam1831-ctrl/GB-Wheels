"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { CarIllustration } from "@/components/ui/CarIllustration";
import { heroCars } from "@/config/catalog";

const spec = {
  crown: { body: "sedan" as const, color: "#0d0e12", pos: "left-0 bottom-[6%] w-[50%] z-30", from: -40 },
  lc300: { body: "suv" as const, color: "#e8eaee", pos: "left-[24%] bottom-[22%] w-[52%] z-20", from: 0 },
  corolla: { body: "sedan" as const, color: "#8d939e", pos: "right-0 bottom-[6%] w-[50%] z-30", from: 40 },
};

function Mountains() {
  return (
    <svg viewBox="0 0 800 300" preserveAspectRatio="none" aria-hidden className="absolute inset-x-0 bottom-0 h-3/4 w-full">
      <defs>
        <linearGradient id="m1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2a2f3a" /><stop offset="1" stopColor="#0b0d12" />
        </linearGradient>
        <linearGradient id="m2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1a1d25" /><stop offset="1" stopColor="#07080b" />
        </linearGradient>
      </defs>
      <polygon fill="url(#m1)" points="0,300 0,170 90,90 150,140 250,40 340,130 420,70 520,150 610,60 700,130 800,80 800,300" />
      <polygon fill="#e9edf5" opacity="0.12" points="250,40 232,72 250,64 268,80" />
      <polygon fill="#e9edf5" opacity="0.12" points="610,60 590,94 610,86 630,98" />
      <polygon fill="url(#m2)" points="0,300 0,220 120,160 210,210 330,140 450,215 560,170 680,220 800,160 800,300" />
    </svg>
  );
}

export function Hero() {
  const reduce = useReducedMotion();
  return (
    <section className="relative isolate overflow-hidden border-b border-border">
      <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(80%_60%_at_25%_30%,rgba(237,16,38,0.16),transparent_65%),linear-gradient(180deg,#0a0b10,#050608)]" />
      <div className="container-gb grid items-center gap-6 py-6 lg:grid-cols-[1.25fr_1fr] lg:gap-12 lg:py-14">
        {/* Car composition */}
        <div className="relative mx-auto aspect-[16/10] w-full max-w-2xl overflow-hidden rounded-lg border border-border/60 bg-bg/40 lg:max-w-none">
          <Mountains />
          <div aria-hidden className="absolute bottom-[8%] left-1/2 h-24 w-3/4 -translate-x-1/2 rounded-full bg-accent/30 blur-3xl" />
          {heroCars.map((c, i) => {
            const s = spec[c.key];
            return (
              <motion.figure
                key={c.key}
                className={`absolute ${s.pos}`}
                initial={reduce ? false : { opacity: 0, x: s.from, y: 20 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{ duration: 0.7, delay: 0.15 * i, ease: "easeOut" }}
              >
                {c.image ? (
                  <Image src={c.image} alt={`${c.name} ${c.tone}`} width={600} height={300} priority className="h-auto w-full drop-shadow-2xl" />
                ) : (
                  <CarIllustration body={s.body} color={s.color} label={`${c.tone} ${c.name}`} className="w-full drop-shadow-[0_18px_24px_rgba(0,0,0,0.6)]" />
                )}
              </motion.figure>
            );
          })}
        </div>
        <ul className="mx-auto -mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-[11px] font-medium uppercase tracking-wider text-fg/60 lg:col-start-1 lg:row-start-2 lg:-mt-6">
          {heroCars.map((c) => <li key={c.key}>{c.name}</li>)}
        </ul>

        {/* Copy */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-center lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:text-left"
        >
          <p className="mb-3 inline-block rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-accent">
            Gilgit-Baltistan&apos;s car marketplace
          </p>
          <h1 className="font-display text-4xl font-semibold uppercase leading-[1.05] sm:text-5xl lg:text-6xl">
            Find Your Next Car in <span className="text-accent">Gilgit-Baltistan</span>
          </h1>
          <p className="mx-auto mt-4 max-w-md text-base text-muted lg:mx-0">
            Buy and sell cars with confidence. Discover the right vehicle with GB Wheels.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:flex sm:justify-center lg:justify-start">
            <Link href="/buy" className="btn-primary sm:min-w-40">Browse Cars <ArrowRight className="size-4" /></Link>
            <Link href="/sell" className="btn-outline sm:min-w-40">Sell Your Car</Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
