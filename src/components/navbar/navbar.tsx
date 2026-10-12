import Link from "next/link";
import { Logo } from "@/components/shared/logo";
import { buttonClasses } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { getStoreSettings } from "@/lib/data/public";
import { telHref, whatsappHref, whatsappNumber } from "@/lib/utils/contact";
import { DesktopNav } from "./desktop-nav";
import { MobileMenu } from "./mobile-menu";
import { NavbarShell } from "./navbar-shell";

export async function Navbar() {
  const settings = await getStoreSettings();

  return (
    <NavbarShell>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-[60] focus:rounded-md focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:text-white"
      >
        Skip to content
      </a>
      <Container className="flex h-16 items-center justify-between gap-6 lg:h-[72px]">
        <Logo storeName={settings.store_name} logoUrl={settings.logo_url} priority />
        <DesktopNav />
        <div className="flex items-center gap-3">
          <div className="hidden lg:block">
            <Link href="/products" className={buttonClasses({ size: "sm" })}>
              Explore Collection
            </Link>
          </div>
          <MobileMenu
            phoneHref={telHref(settings.phone_primary)}
            whatsappHref={whatsappHref(whatsappNumber(settings))}
            instagramUrl={settings.instagram_url}
          />
        </div>
      </Container>
    </NavbarShell>
  );
}
