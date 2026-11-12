import { Hero } from "@/components/home/Hero";
import { SearchPanel } from "@/components/home/SearchPanel";
import { RecentCarousel } from "@/components/home/RecentCarousel";
import {
  BrandGrid, DistrictGrid, HowItWorks, ManagedPromo, Testimonials, VehicleGridSection, WhyChoose,
} from "@/components/home/Sections";
import { ConfigNotice } from "@/components/ui/ConfigNotice";
import { getFeaturedVehicles, getFilterOptions, getLatestVehicles, getSavedIds, mergeModels } from "@/lib/data/vehicles";
import { siteConfig } from "@/config/site";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [featured, latest, options, saved] = await Promise.all([
    getFeaturedVehicles(3),
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
      <div className="container-gb"><ConfigNotice className="mt-4" /></div>
      <div className="container-gb"><SearchPanel models={mergeModels(options.models)} /></div>
      <BrandGrid counts={options.brandCounts} />
      {featured.length > 0 && <VehicleGridSection title={<>Featured <em>Cars</em></>} vehicles={featured} saved={saved} href="/buy" cols={3} />}
      <VehicleGridSection title={<>Latest <em>Cars</em></>} vehicles={latest.slice(0, 6)} saved={saved} href="/buy" cols={3} sample />
      <WhyChoose />
      <RecentCarousel items={latest} />
      <DistrictGrid counts={options.districtCounts} />
      <HowItWorks />
      <ManagedPromo />
      <Testimonials />
    </>
  );
}
