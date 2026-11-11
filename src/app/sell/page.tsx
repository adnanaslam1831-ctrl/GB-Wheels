import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, Camera, ClipboardList, Rocket } from "lucide-react";
import { TrustSection } from "@/components/home/Sections";

export const metadata: Metadata = {
  title: "Sell Your Car in Gilgit-Baltistan",
  description: "List your car for free on GB Wheels, or let us manage the whole sale for you.",
};

export default function SellPage() {
  return (
    <>
      <section className="container-gb py-12 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent">Sell your car</p>
        <h1 className="mx-auto mt-2 max-w-3xl font-display text-4xl font-semibold uppercase sm:text-5xl">
          Reach buyers across <span className="text-accent">Gilgit-Baltistan</span>
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-muted">List for free in a few minutes, or hand the whole sale to GB Wheels.</p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/dashboard/listings/new" className="btn-primary">Start Your Free Listing</Link>
          <Link href="/managed-sale" className="btn-outline">Managed Sale by GB Wheels</Link>
        </div>
      </section>

      <section className="container-gb pb-12">
        <div className="grid gap-4 md:grid-cols-4">
          {[
            [ClipboardList, "1. Create an account", "Free and quick. Your phone number is never shown publicly."],
            [Camera, "2. Add your car", "Five simple steps: details, condition, photos, price, selling preference. Save a draft any time."],
            [BadgeCheck, "3. We review it", "Every listing is checked before going live and appears as Pending Approval until then."],
            [Rocket, "4. Buyers get in touch", "Enquiries come to GB Wheels, who coordinate with you."],
          ].map(([Icon, t, b], i) => {
            const I = Icon as typeof Camera;
            return (
              <div key={i} className="glass-card p-5"><I className="mb-3 size-7 text-accent" />
                <h2 className="font-display text-lg uppercase tracking-wide">{t as string}</h2><p className="mt-1 text-sm text-muted">{b as string}</p></div>
            );
          })}
        </div>
      </section>
      <TrustSection title="Why sell with GB Wheels" />
    </>
  );
}
