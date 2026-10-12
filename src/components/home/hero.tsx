import { MapPin, QrCode } from "lucide-react";
import Link from "next/link";
import { BagIllustration } from "@/components/shared/bag-illustration";
import { SmartImage } from "@/components/shared/smart-image";
import { buttonClasses } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { getFeaturedProducts, getStoreSettings } from "@/lib/data/public";

const LINES = ["Trolley Bags", "School Bags", "Ladies Purses"];

/** Illustrated composition used until real product photography is added. */
function HeroComposition() {
  return (
    <div className="absolute inset-0 bg-ink">
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(120%_80%_at_70%_10%,rgba(201,151,43,0.16),transparent_60%)]"
      />
      <div
        aria-hidden
        className="absolute inset-5 rounded-[14px] border border-white/8 sm:inset-7"
      />
      <div className="absolute inset-0 flex items-end justify-center gap-4 px-10 pb-20 text-gold sm:gap-8 sm:pb-24">
        <BagIllustration kind="backpack" className="h-[34%] w-auto opacity-70" />
        <BagIllustration kind="trolley" className="h-[62%] w-auto" />
        <BagIllustration kind="handbag" className="h-[30%] w-auto opacity-70" />
      </div>
      <div aria-hidden className="absolute inset-x-10 bottom-20 h-px bg-white/10 sm:bottom-24" />
    </div>
  );
}

export async function Hero() {
  const [settings, featured] = await Promise.all([getStoreSettings(), getFeaturedProducts(8)]);
  const heroProduct = featured.ok ? featured.data.find((product) => product.image) : undefined;
  const locality = [settings.city].filter(Boolean).join(", ");

  return (
    <section aria-labelledby="hero-heading" className="relative overflow-hidden">
      <Container className="grid items-center gap-10 pt-8 pb-16 sm:pt-12 lg:grid-cols-12 lg:gap-12 lg:pt-16 lg:pb-24">
        <div className="lg:col-span-6">
          <p className="text-eyebrow text-gold-deep">{settings.store_name}</p>
          <h1
            id="hero-heading"
            className="mt-5 font-display text-[2.3rem] leading-[1.05] font-medium tracking-tight text-ink min-[400px]:text-[2.6rem] sm:text-6xl xl:text-[4.5rem]"
          >
            Carry Your Journey.
            <br />
            <span className="italic">Carry Your Style.</span>
          </h1>
          <p className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-[15px] text-muted sm:text-base">
            {LINES.map((line, index) => (
              <span key={line} className="inline-flex items-center gap-3">
                {index > 0 && <span aria-hidden className="size-1 rounded-full bg-gold" />}
                {line}
              </span>
            ))}
          </p>
          <div className="mt-9 flex flex-col gap-3 min-[400px]:flex-row">
            <Link href="/products" className={buttonClasses({ size: "lg" })}>
              Explore Collection
            </Link>
            <Link href="/contact" className={buttonClasses({ variant: "secondary", size: "lg" })}>
              Visit Store
            </Link>
          </div>
          {(settings.address || locality) && (
            <p className="mt-8 flex items-start gap-2 text-sm text-muted">
              <MapPin
                aria-hidden
                className="mt-0.5 size-4 shrink-0 text-gold-deep"
                strokeWidth={1.75}
              />
              <span>{[settings.address, locality].filter(Boolean).join(", ")}</span>
            </p>
          )}
        </div>

        <div className="relative lg:col-span-6">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[20px] shadow-(--shadow-card-hover) sm:aspect-[5/5] lg:aspect-[4/5]">
            {heroProduct?.image ? (
              <SmartImage
                src={heroProduct.image.image_url}
                alt={heroProduct.image.alt_text || heroProduct.name}
                fill
                priority
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
                fallbackTone="dark"
                fallbackKind="trolley"
              />
            ) : (
              <HeroComposition />
            )}
          </div>

          {/* Light glass card: the in-store QR journey */}
          <div className="absolute -bottom-6 left-4 max-w-[17rem] rounded-2xl border border-white/60 bg-white/80 p-4 shadow-(--shadow-card) backdrop-blur-md sm:-right-4 sm:left-auto lg:right-auto lg:-left-8">
            <div className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-ink text-gold">
                <QrCode aria-hidden className="size-[18px]" strokeWidth={1.75} />
              </span>
              <p className="text-[13px] leading-snug text-ink">
                <span className="font-semibold">In the showroom?</span> Scan the QR on any product
                to see its details and enquire instantly.
              </p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
