import type { Metadata } from "next";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = { title: "Terms and Conditions" };

export default function Page() {
  return (
    <section className="container-gb max-w-3xl py-14">
      <h1 className="font-display text-4xl font-semibold uppercase">Terms and Conditions</h1>
      <p className="mt-4 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-100">
        Template text for {siteConfig.name}. Have it reviewed by a qualified lawyer and adapted to your business before launch.
      </p>
      <div className="mt-6 space-y-4 leading-relaxed text-muted">
        <p>GB Wheels is a marketplace and brokerage service. Listings are submitted by sellers; seller-declared information has not been verified unless a verification badge says otherwise.</p>
        <p>Sellers must be the owner or authorised to sell the vehicle and must describe it honestly, including known defects. We may reject, edit or remove any listing.</p>
        <p>For Managed Sales, the brokerage fee and advertised price are shown to the seller, who must agree before the vehicle is advertised. Brokerage is due only when a sale is completed.</p>
        <p>Buyers should inspect a vehicle and check its documents before paying. GB Wheels does not guarantee any listing unless it states so in writing.</p>
      </div>
    </section>
  );
}
