import { MapPin, Phone } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/shared/logo";
import { Container } from "@/components/ui/container";
import { InstagramIcon, WhatsAppIcon } from "@/components/ui/icons";
import { getActiveCategories, getStoreSettings } from "@/lib/data/public";
import {
  formatPhone,
  fullAddress,
  instagramHandle,
  mapsDirectionsUrl,
  telHref,
  whatsappHref,
  whatsappNumber,
} from "@/lib/utils/contact";
import { CopyrightYear } from "./copyright-year";

const QUICK_LINKS = [
  { href: "/", label: "Home" },
  { href: "/products", label: "All Products" },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact & Location" },
];

function FooterHeading({ children }: { children: string }) {
  return <h2 className="text-eyebrow mb-5 text-gold">{children}</h2>;
}

const linkClass = "text-sm text-white/65 transition-colors hover:text-white";

export async function Footer() {
  const [settings, categories] = await Promise.all([getStoreSettings(), getActiveCategories()]);

  const phones = [settings.phone_primary, settings.phone_secondary].filter(
    (phone): phone is string => Boolean(phone),
  );
  const whatsapp = whatsappHref(whatsappNumber(settings));
  const address = fullAddress(settings);
  const maps = mapsDirectionsUrl(settings);
  const handle = instagramHandle(settings.instagram_url);

  return (
    <footer className="bg-ink text-white">
      <Container className="grid gap-12 py-16 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8 lg:py-20">
        <div className="lg:col-span-4">
          <Logo tone="dark" storeName={settings.store_name} logoUrl={settings.logo_url} />
          <p className="mt-6 max-w-xs text-sm leading-relaxed text-white/60">
            A bag showroom for trolley bags, school bags and ladies purses. Browse online, then
            visit us to see every piece in person.
          </p>
        </div>

        <nav aria-label="Quick links" className="lg:col-span-2">
          <FooterHeading>Quick Links</FooterHeading>
          <ul className="space-y-3">
            {QUICK_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={linkClass}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Collections" className="lg:col-span-2">
          <FooterHeading>Collections</FooterHeading>
          <ul className="space-y-3">
            {categories.ok && categories.data.length > 0 ? (
              categories.data.map((category) => (
                <li key={category.id}>
                  <Link href={`/category/${category.slug}`} className={linkClass}>
                    {category.name}
                  </Link>
                </li>
              ))
            ) : (
              <li>
                <Link href="/products" className={linkClass}>
                  View all products
                </Link>
              </li>
            )}
          </ul>
        </nav>

        <div className="lg:col-span-4">
          <FooterHeading>Visit &amp; Contact</FooterHeading>
          <ul className="space-y-4 text-sm text-white/65">
            {address && (
              <li className="flex gap-3">
                <MapPin
                  aria-hidden
                  className="mt-0.5 size-4 shrink-0 text-gold"
                  strokeWidth={1.75}
                />
                {maps ? (
                  <a
                    href={maps}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white"
                  >
                    {address}
                    <span className="sr-only"> (opens Google Maps)</span>
                  </a>
                ) : (
                  <span>{address}</span>
                )}
              </li>
            )}
            {phones.length > 0 && (
              <li className="flex gap-3">
                <Phone
                  aria-hidden
                  className="mt-0.5 size-4 shrink-0 text-gold"
                  strokeWidth={1.75}
                />
                <span className="flex flex-wrap gap-x-3 gap-y-1">
                  {phones.map((phone) => {
                    const href = telHref(phone);
                    const label = formatPhone(phone);
                    return href ? (
                      <a key={phone} href={href} className="hover:text-white">
                        {label}
                      </a>
                    ) : (
                      <span key={phone}>{label}</span>
                    );
                  })}
                </span>
              </li>
            )}
            {whatsapp && (
              <li className="flex gap-3">
                <WhatsAppIcon className="mt-0.5 size-4 shrink-0 text-gold" />
                <a
                  href={whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white"
                >
                  Chat on WhatsApp
                </a>
              </li>
            )}
            {settings.instagram_url && (
              <li className="flex gap-3">
                <InstagramIcon className="mt-0.5 size-4 shrink-0 text-gold" />
                <a
                  href={settings.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white"
                >
                  {handle ?? "Instagram"}
                </a>
              </li>
            )}
          </ul>
        </div>
      </Container>

      <div className="border-t border-line-dark">
        <Container className="flex flex-col gap-2 py-6 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © <CopyrightYear /> {settings.store_name}. All rights reserved.
          </p>
          <p>Digital showroom · Visit the store to purchase</p>
        </Container>
      </div>
    </footer>
  );
}
