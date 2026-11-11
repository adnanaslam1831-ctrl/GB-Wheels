import type { Metadata } from "next";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function Page() {
  return (
    <section className="container-gb max-w-3xl py-14">
      <h1 className="font-display text-4xl font-semibold uppercase">Privacy Policy</h1>
      <p className="mt-4 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-100">
        Template text for {siteConfig.name}. Have it reviewed by a qualified lawyer and adapted to your business before launch.
      </p>
      <div className="mt-6 space-y-4 leading-relaxed text-muted">
        <p>We collect the information you give us: account details (name, email, phone), vehicle listings and photos, and enquiries you send.</p>
        <p>Your phone number and email are visible only to GB Wheels staff. Buyers never see a seller&apos;s private contact details; enquiries go through GB Wheels.</p>
        <p>We use your information to run the marketplace, review listings, handle enquiries and managed sales, and contact you about them. We do not sell your personal data.</p>
        <p>Accounts and data are stored with our infrastructure provider, Supabase. You can ask us to correct or delete your data by contacting us.</p>
      </div>
    </section>
  );
}
