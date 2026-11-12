"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";

/** Hero: three-car showcase on the left (photo supplied with the design), headline on the right. */
export function Hero() {
  const reduce = useReducedMotion();
  return (
    <section className="relative isolate overflow-hidden bg-bg">
      <div className="relative min-h-[180px] sm:min-h-[280px] lg:h-[clamp(330px,26vw,470px)]">
        {/* Photo: left ~2/3, fading into the page background */}
        <div className="absolute inset-y-0 left-0 w-[74%] lg:w-[64%]">
          <Image src="/photos/hero-m.jpg" alt="Toyota Crown, Land Cruiser LC300 and Corolla GLI in the Gilgit-Baltistan mountains" fill priority sizes="70vw" className="object-cover object-left sm:hidden" />
          <Image src="/photos/hero.jpg" alt="" aria-hidden fill priority sizes="64vw" className="hidden object-cover object-left sm:block" />
          <div aria-hidden className="absolute inset-y-0 right-0 w-1/3 bg-gradient-to-r from-transparent to-bg" />
          <div aria-hidden className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-b from-transparent to-bg/60" />
        </div>

        <div className="container-gb relative flex h-full min-h-[inherit] items-center justify-end">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="w-[38%] lg:w-[36%]"
          >
            <h1 className="font-display text-[16px] font-bold italic leading-[1.1] sm:text-4xl lg:-rotate-3 lg:text-[2.7rem] xl:text-5xl">
              Get Your Car or <br />Sell Your Car in <br />
              <span className="text-accent drop-shadow-[0_0_18px_rgba(237,16,38,0.45)]">Gilgit Baltistan!</span>
            </h1>
            <p className="mt-2 text-[10px] italic text-fg/90 sm:mt-4 sm:text-base lg:-rotate-3">Trusted. Professional. Local.</p>
            <Link
              href="/buy"
              className="red-glow mt-3 inline-flex items-center gap-2 rounded-full bg-gradient-to-b from-[#ff2a3f] to-[#c10a1d] py-1 pl-4 pr-1 text-[11px] font-semibold text-white sm:mt-6 sm:gap-4 sm:py-2 sm:pl-7 sm:pr-2 sm:text-base"
            >
              Browse Cars
              <span className="grid size-6 place-items-center rounded-full border border-white/80 bg-black/70 sm:size-9"><ArrowRight className="size-3.5 sm:size-5" /></span>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
