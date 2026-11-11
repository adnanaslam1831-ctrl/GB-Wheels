"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { CarIllustration } from "@/components/ui/CarIllustration";
import { cn } from "@/lib/utils";
import type { VehicleImage } from "@/types/db";

export function Gallery({ images, title }: { images: VehicleImage[]; title: string }) {
  const [i, setI] = useState(0);
  const touch = useRef<number | null>(null);

  if (images.length === 0) {
    return (
      <div className="grid aspect-[16/10] place-items-center rounded-lg border border-border bg-[radial-gradient(70%_70%_at_50%_60%,#1d2028,#0c0e13)]">
        <div className="text-center">
          <CarIllustration color="#2b2f38" className="mx-auto w-3/4 max-w-md opacity-90" />
          <p className="mt-2 text-sm text-muted">No photos uploaded yet</p>
        </div>
      </div>
    );
  }
  const go = (d: number) => setI((n) => (n + d + images.length) % images.length);
  const cur = images[i];

  return (
    <div>
      <div
        className="group relative aspect-[16/10] overflow-hidden rounded-lg border border-border bg-black"
        onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touch.current == null) return;
          const dx = e.changedTouches[0].clientX - touch.current;
          if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
          touch.current = null;
        }}
      >
        <Image key={cur.id} src={cur.url} alt={cur.alt_text ?? `${title} - ${cur.angle ?? `photo ${i + 1}`}`} fill priority={i === 0}
          sizes="(min-width:1024px) 60vw, 100vw" className="object-cover" />
        {images.length > 1 && (
          <>
            <button aria-label="Previous photo" onClick={() => go(-1)} className="absolute left-2 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-black/60 hover:bg-black/80"><ChevronLeft className="size-5" /></button>
            <button aria-label="Next photo" onClick={() => go(1)} className="absolute right-2 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-black/60 hover:bg-black/80"><ChevronRight className="size-5" /></button>
            <span className="absolute bottom-2 right-2 rounded bg-black/70 px-2 py-0.5 text-xs">{i + 1} / {images.length}</span>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
          {images.map((img, n) => (
            <button key={img.id} onClick={() => setI(n)} aria-label={`Show photo ${n + 1}`} aria-current={n === i}
              className={cn("relative h-16 w-24 shrink-0 overflow-hidden rounded border", n === i ? "border-accent" : "border-border opacity-70 hover:opacity-100")}>
              <Image src={img.url} alt="" fill sizes="96px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
