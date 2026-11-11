import type { Metadata } from "next";
import { Camera, Handshake, Megaphone, MessagesSquare, PenLine, Users } from "lucide-react";
import { ManagedSaleForm } from "@/components/sell/ManagedSaleForm";
import { ConfigNotice } from "@/components/ui/ConfigNotice";
import { getCurrentProfile } from "@/lib/auth";
import { formatPKR } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Managed Car Sale",
  description: "Let GB Wheels photograph, list, promote and sell your car in Gilgit-Baltistan.",
};
export const dynamic = "force-dynamic";

const services = [
  [Camera, "Professional photography"], [PenLine, "Listing content written for you"], [Megaphone, "Social media promotion"],
  [MessagesSquare, "Buyer enquiries handled"], [Users, "Viewings coordinated"], [Handshake, "Negotiation and sale support"],
] as const;

export default async function ManagedSalePage() {
  const profile = await getCurrentProfile();
  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-border">
        <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(70%_60%_at_80%_0%,rgba(237,16,38,0.2),transparent_65%)]" />
        <div className="container-gb py-12 text-center sm:py-16">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">Managed Sale</p>
          <h1 className="mx-auto mt-2 max-w-3xl font-display text-4xl font-semibold uppercase sm:text-5xl">We sell your car. You relax.</h1>
          <p className="mx-auto mt-3 max-w-xl text-muted">A professional brokerage service for sellers who don&apos;t have the time to deal with photos, buyers and negotiations.</p>
        </div>
      </section>

      <div className="container-gb grid gap-10 py-12 lg:grid-cols-[1fr_1.1fr]">
        <div className="space-y-8">
          <div>
            <h2 className="section-title mb-4">What GB Wheels does</h2>
            <ul className="grid gap-3 sm:grid-cols-2">{services.map(([I, t]) => (
              <li key={t} className="glass-card flex items-center gap-3 p-3 text-sm"><I className="size-5 shrink-0 text-accent" />{t}</li>))}</ul>
          </div>
          <div>
            <h2 className="section-title mb-4">How the brokerage works</h2>
            <div className="glass-card space-y-3 p-5 text-sm">
              <p className="text-muted">You tell us the amount you want to receive. GB Wheels adds an agreed brokerage fee to set the advertised price. We confirm the exact figures with you and <strong className="text-white">nothing is advertised until you explicitly agree</strong>.</p>
              <div className="rounded-md border border-border bg-surface-2 p-3">
                <p className="text-xs uppercase tracking-wide text-muted">Illustration only</p>
                <p className="mt-1 flex justify-between"><span>You receive</span><span>{formatPKR(1000000)}</span></p>
                <p className="flex justify-between"><span>Brokerage fee</span><span>{formatPKR(50000)}</span></p>
                <p className="mt-1 flex justify-between border-t border-border pt-1 font-semibold"><span>Advertised price</span><span>{formatPKR(1050000)}</span></p>
              </div>
              <p className="text-xs text-muted">The real fee depends on GB Wheels&apos; current brokerage rules and is calculated by our system, not on this page. Brokerage is due only when a sale is completed.</p>
            </div>
          </div>
        </div>
        <div>
          <h2 className="section-title mb-4">Request a managed sale</h2>
          <ConfigNotice className="mb-4" />
          <ManagedSaleForm defaults={{ name: profile?.full_name ?? "", phone: profile?.phone ?? "" }} />
        </div>
      </div>
    </>
  );
}
