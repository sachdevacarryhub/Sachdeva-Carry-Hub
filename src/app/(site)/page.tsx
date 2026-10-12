import type { Metadata } from "next";
import { CategoryShowcase } from "@/components/home/category-showcase";
import { Hero } from "@/components/home/hero";
import { FeaturedCollection, NewArrivals } from "@/components/home/product-section";
import { StoreIntro } from "@/components/home/store-intro";
import { VisitCta } from "@/components/home/visit-cta";
import { JsonLd, storeJsonLd } from "@/components/shared/json-ld";
import { Reveal } from "@/components/shared/reveal";
import { StoreLocation } from "@/components/shared/store-location";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { getStoreSettings } from "@/lib/data/public";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getStoreSettings();
  return {
    title: { absolute: `${settings.store_name} | Premium Bags & Trolley Bags` },
    alternates: { canonical: "/" },
  };
}

export default async function HomePage() {
  const settings = await getStoreSettings();

  return (
    <>
      <JsonLd data={storeJsonLd(settings)} />
      <Hero />
      <CategoryShowcase />
      <FeaturedCollection />
      <NewArrivals />
      <StoreIntro />
      <VisitCta />
      <section aria-labelledby="location-heading" className="pb-20 sm:pb-28">
        <Container>
          <SectionHeading
            eyebrow="Contact & location"
            title={<span id="location-heading">Find us</span>}
            className="mb-10"
          />
          <Reveal>
            <StoreLocation settings={settings} headingLevel="h3" />
          </Reveal>
        </Container>
      </section>
    </>
  );
}
