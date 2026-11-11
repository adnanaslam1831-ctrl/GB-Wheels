import { Hero } from "@/components/home/Hero";
import { SearchPanel } from "@/components/home/SearchPanel";
import {
  BrandGrid, DistrictGrid, HowItWorks, ManagedPromo, PromoBanner, Testimonials, TrustSection, VehicleGridSection,
} from "@/components/home/Sections";
import { ConfigNotice } from "@/components/ui/ConfigNotice";
import { getFeaturedVehicles, getFilterOptions, getLatestVehicles, getSavedIds, mergeModels } from "@/lib/data/vehicles";
import { siteConfig } from "@/config/site";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [featured, latest, options, saved] = await Promise.all([
    getFeaturedVehicles(4),
    getLatestVehicles(8),
    getFilterOptions(),
    getSavedIds(),
  ]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AutomotiveBusiness",
    name: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
    areaServed: "Gilgit-Baltistan, Pakistan",
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Hero />
      <div className="container-gb pt-2"><ConfigNotice className="mt-4" /></div>
      <div className="container-gb"><SearchPanel models={mergeModels(options.models)} /></div>
      <BrandGrid counts={options.brandCounts} />
      {featured.length > 0 && <VehicleGridSection title="Featured Cars" vehicles={featured} saved={saved} href="/buy" />}
      <VehicleGridSection title="Latest Cars" vehicles={latest} saved={saved} href="/buy" />
      <DistrictGrid counts={options.districtCounts} />
      <HowItWorks />
      <ManagedPromo />
      <TrustSection />
      <PromoBanner />
      <Testimonials />
    </>
  );
}
