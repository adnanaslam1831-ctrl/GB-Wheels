"use client";

import { useEffect, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";

export function FilterDrawer({ children, activeCount }: { children: React.ReactNode; activeCount: number }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="btn-outline lg:hidden">
        <SlidersHorizontal className="size-4" /> Filters{activeCount ? ` (${activeCount})` : ""}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
          <button aria-label="Close filters" className="absolute inset-0 bg-black/70" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[88%] max-w-sm flex-col border-r border-border bg-bg">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h2 className="font-display text-lg uppercase tracking-wide">Filters</h2>
              <button onClick={() => setOpen(false)} aria-label="Close" className="grid size-10 place-items-center"><X className="size-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 pb-24">{children}</div>
          </div>
        </div>
      )}
    </>
  );
}
