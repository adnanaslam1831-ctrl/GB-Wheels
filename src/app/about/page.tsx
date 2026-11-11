import type { Metadata } from "next";
import { TrustSection } from "@/components/home/Sections";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = { title: "About Us", description: "GB Wheels makes buying and selling vehicles easier, more transparent and more accessible across Gilgit-Baltistan." };

export default function AboutPage() {
  return (
    <>
      <section className="container-gb max-w-3xl py-14">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent">About us</p>
        <h1 className="mt-2 font-display text-4xl font-semibold uppercase sm:text-5xl">{siteConfig.tagline}</h1>
        <div className="mt-6 space-y-4 leading-relaxed text-muted">
          <p>GB Wheels aims to make buying and selling vehicles easier, more transparent and more accessible across Gilgit-Baltistan.</p>
          <p>We bring together buyers, sellers, dealers and showrooms in one place built for the region, with locations from Gilgit and Skardu to Hunza, Nagar, Astore, Diamer, Ghizer and Ghanche.</p>
          <p>Every listing is reviewed before it goes live. Where a seller does not know a detail, such as customs status, we let them say so instead of guessing. Verification badges appear only after GB Wheels has actually completed the relevant check.</p>
          <p>Prefer not to handle the sale yourself? Our Managed Sale service takes care of photography, marketing, enquiries, viewings and negotiation.</p>
        </div>
      </section>
      <TrustSection title="What we stand for" />
    </>
  );
}
