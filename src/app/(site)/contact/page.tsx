import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { CallButton, WhatsAppButton } from "@/components/shared/contact-buttons";
import { JsonLd, storeJsonLd } from "@/components/shared/json-ld";
import { StoreLocation } from "@/components/shared/store-location";
import { Container } from "@/components/ui/container";
import { getStoreSettings } from "@/lib/data/public";
import { whatsappNumber } from "@/lib/utils/contact";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getStoreSettings();
  return {
    title: "Contact & Location",
    description: `Visit ${settings.store_name}${settings.city ? ` in ${settings.city}` : ""}. Call, WhatsApp or get directions to the showroom.`,
    alternates: { canonical: "/contact" },
  };
}

export default async function ContactPage() {
  const settings = await getStoreSettings();

  return (
    <>
      <JsonLd data={storeJsonLd(settings)} />
      <PageHeader
        eyebrow="Contact"
        title="Visit Our Store"
        description="See the collection in person, or reach us on WhatsApp and phone with any question."
        breadcrumbs={[{ href: "/", label: "Home" }, { label: "Contact" }]}
      >
        <div className="mt-8 flex flex-col gap-3 min-[400px]:flex-row">
          <WhatsAppButton
            phone={whatsappNumber(settings)}
            label="WhatsApp Us"
            message={`Hello ${settings.store_name}, I have a question.`}
          />
          <CallButton phone={settings.phone_primary} />
        </div>
      </PageHeader>
      <Container className="py-12 sm:py-16">
        <StoreLocation settings={settings} showOwner />
      </Container>
    </>
  );
}
