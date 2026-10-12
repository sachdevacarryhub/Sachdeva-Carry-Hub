import { MapPin } from "lucide-react";
import { CallButton, WhatsAppButton } from "@/components/shared/contact-buttons";
import { Reveal } from "@/components/shared/reveal";
import { buttonClasses } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { getStoreSettings } from "@/lib/data/public";
import { fullAddress, mapsDirectionsUrl, whatsappNumber } from "@/lib/utils/contact";

export async function VisitCta() {
  const settings = await getStoreSettings();
  const address = fullAddress(settings);
  const directions = mapsDirectionsUrl(settings);

  return (
    <section aria-labelledby="visit-heading" className="py-16 sm:py-24">
      <Container>
        <Reveal className="relative overflow-hidden rounded-[24px] bg-ink px-6 py-14 text-white sm:px-12 sm:py-20">
          <div
            aria-hidden
            className="absolute inset-0 bg-[radial-gradient(80%_120%_at_100%_0%,rgba(201,151,43,0.18),transparent_55%)]"
          />
          <div className="relative grid gap-10 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-7">
              <p className="text-eyebrow text-gold">Visit the showroom</p>
              <h2
                id="visit-heading"
                className="mt-4 font-display text-3xl leading-tight font-medium sm:text-[2.75rem]"
              >
                See the collection in person.
              </h2>
              {address && (
                <p className="mt-5 flex max-w-lg items-start gap-2 text-white/65">
                  <MapPin
                    aria-hidden
                    className="mt-1 size-4 shrink-0 text-gold"
                    strokeWidth={1.75}
                  />
                  {address}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap lg:col-span-5 lg:justify-end">
              {directions && (
                <a
                  href={directions}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonClasses({ variant: "gold", size: "lg" })}
                >
                  Get Directions
                </a>
              )}
              <WhatsAppButton
                phone={whatsappNumber(settings)}
                label="WhatsApp"
                variant="light"
                message={`Hello ${settings.store_name}, I would like to know more about your collection.`}
              />
              <CallButton phone={settings.phone_primary} variant="light" />
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
