import { ExternalLink, MapPin, Phone, User } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";
import { InstagramIcon, WhatsAppIcon } from "@/components/ui/icons";
import {
  formatPhone,
  fullAddress,
  instagramHandle,
  mapsDirectionsUrl,
  mapsEmbedUrl,
  telHref,
  whatsappHref,
  whatsappNumber,
} from "@/lib/utils/contact";
import type { StoreSettings } from "@/types";

function Row({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-4 border-b border-line py-5 last:border-b-0">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-line bg-cream text-gold-deep">
        {icon}
      </span>
      <div className="min-w-0">
        <dt className="text-eyebrow text-muted">{label}</dt>
        <dd className="mt-1.5 text-[15px] break-words text-ink">{children}</dd>
      </div>
    </div>
  );
}

/** Contact details + embedded map, all derived from store settings. */
export function StoreLocation({
  settings,
  showOwner = false,
  headingLevel = "h2",
}: {
  settings: StoreSettings;
  showOwner?: boolean;
  headingLevel?: "h2" | "h3";
}) {
  const Heading = headingLevel;
  const address = fullAddress(settings);
  const directions = mapsDirectionsUrl(settings);
  const embed = mapsEmbedUrl(settings);
  const whatsapp = whatsappHref(whatsappNumber(settings));
  const phones = [settings.phone_primary, settings.phone_secondary].filter(
    (phone): phone is string => Boolean(phone),
  );

  return (
    <div className="grid overflow-hidden rounded-[20px] border border-line bg-paper shadow-(--shadow-card) lg:grid-cols-2">
      <div className="p-6 sm:p-10">
        <Heading className="font-display text-2xl text-ink sm:text-3xl">
          {settings.store_name}
        </Heading>
        <dl className="mt-6">
          {showOwner && settings.owner_name && (
            <Row icon={<User className="size-[18px]" strokeWidth={1.5} />} label="Owner">
              {settings.owner_name}
            </Row>
          )}
          {address && (
            <Row icon={<MapPin className="size-[18px]" strokeWidth={1.5} />} label="Address">
              {address}
            </Row>
          )}
          {phones.length > 0 && (
            <Row icon={<Phone className="size-[18px]" strokeWidth={1.5} />} label="Phone">
              <span className="flex flex-col gap-1">
                {phones.map((phone) => {
                  const href = telHref(phone);
                  return href ? (
                    <a
                      key={phone}
                      href={href}
                      className="underline-offset-4 hover:text-gold-deep hover:underline"
                    >
                      {formatPhone(phone)}
                    </a>
                  ) : (
                    <span key={phone}>{phone}</span>
                  );
                })}
              </span>
            </Row>
          )}
          {whatsapp && (
            <Row icon={<WhatsAppIcon className="size-[18px]" />} label="WhatsApp">
              <a
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="underline-offset-4 hover:text-gold-deep hover:underline"
              >
                {formatPhone(whatsappNumber(settings))}
              </a>
            </Row>
          )}
          {settings.instagram_url && (
            <Row icon={<InstagramIcon className="size-[18px]" />} label="Instagram">
              <a
                href={settings.instagram_url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline-offset-4 hover:text-gold-deep hover:underline"
              >
                {instagramHandle(settings.instagram_url) ?? "Follow us"}
              </a>
            </Row>
          )}
        </dl>
        {directions && (
          <a
            href={directions}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClasses({ className: "mt-8 w-full sm:w-auto" })}
          >
            Visit Our Store
            <ExternalLink aria-hidden className="size-4" strokeWidth={1.75} />
            <span className="sr-only">(opens Google Maps)</span>
          </a>
        )}
      </div>

      <div className="relative min-h-[320px] bg-cream-deep lg:min-h-full">
        {embed ? (
          <iframe
            title={`Map showing the location of ${settings.store_name}`}
            src={embed}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="absolute inset-0 h-full w-full border-0 grayscale-[0.35]"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center p-8 text-center text-sm text-muted">
            The store map will appear here once the address is added.
          </div>
        )}
      </div>
    </div>
  );
}
