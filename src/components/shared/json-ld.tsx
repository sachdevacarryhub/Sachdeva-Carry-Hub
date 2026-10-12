import { absoluteUrl } from "@/lib/env";
import { toE164Digits } from "@/lib/utils/contact";
import type { StoreSettings } from "@/types";

/** Serialises JSON-LD safely (prevents `</script>` injection). */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

/** schema.org Store for local search. Only includes configured, real data. */
export function storeJsonLd(settings: StoreSettings): Record<string, unknown> {
  const phone = toE164Digits(settings.phone_primary);
  const url = absoluteUrl("/");
  const logo = settings.logo_url ?? absoluteUrl("/brand/logo-full.png");

  return {
    "@context": "https://schema.org",
    "@type": "Store",
    name: settings.store_name,
    ...(url && { url }),
    ...(logo && { logo, image: logo }),
    ...(phone && { telephone: `+${phone}` }),
    ...(settings.owner_name && { founder: { "@type": "Person", name: settings.owner_name } }),
    ...(settings.established_on && { foundingDate: settings.established_on }),
    ...(settings.address && {
      address: {
        "@type": "PostalAddress",
        streetAddress: settings.address,
        ...(settings.city && { addressLocality: settings.city }),
        ...(settings.state && { addressRegion: settings.state }),
        ...(settings.pincode && { postalCode: settings.pincode }),
        addressCountry: "IN",
      },
    }),
    ...(settings.google_maps_url && { hasMap: settings.google_maps_url }),
    ...(settings.instagram_url && { sameAs: [settings.instagram_url] }),
  };
}
