"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteVehicle, setListingStatus } from "@/app/actions/vehicles";
import type { ListingStatus } from "@/types/db";

export function ListingActions({ id, slug, status }: { id: string; slug: string; status: ListingStatus }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    start(async () => {
      const r = await fn();
      if (!r.ok) setErr(r.error ?? "Something went wrong");
      else { setErr(null); router.refresh(); }
    });

  const btn = "rounded-md border border-border px-3 py-1.5 text-xs font-semibold transition hover:border-accent hover:text-accent disabled:opacity-50";
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {(status === "active" || status === "reserved") && <Link href={`/cars/${slug}`} className={btn}>View</Link>}
        {status !== "sold" && <Link href={`/dashboard/listings/${id}/edit`} className={btn}>Edit</Link>}
        {(status === "draft" || status === "rejected") && (
          <button disabled={pending} className={btn} onClick={() => run(() => setListingStatus(id, "pending"))}>Submit for review</button>
        )}
        {status === "active" && <button disabled={pending} className={btn} onClick={() => run(() => setListingStatus(id, "reserved"))}>Mark reserved</button>}
        {status === "reserved" && <button disabled={pending} className={btn} onClick={() => run(() => setListingStatus(id, "active"))}>Back to active</button>}
        {(status === "active" || status === "reserved") && (
          <button disabled={pending} className={btn} onClick={() => confirm("Mark this car as sold? This can't be undone.") && run(() => setListingStatus(id, "sold"))}>Mark sold</button>
        )}
        <button disabled={pending} className={`${btn} hover:!border-red-500 hover:!text-red-400`}
          onClick={() => confirm("Delete this listing and its photos permanently?") && run(() => deleteVehicle(id))}>Delete</button>
      </div>
      {err && <p className="mt-2 text-xs text-accent" role="alert">{err}</p>}
    </div>
  );
}
