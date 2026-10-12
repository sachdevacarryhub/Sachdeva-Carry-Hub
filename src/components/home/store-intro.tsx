import { MessageCircle, QrCode, Store } from "lucide-react";
import Link from "next/link";
import { Reveal } from "@/components/shared/reveal";
import { Container } from "@/components/ui/container";
import { getStoreSettings } from "@/lib/data/public";

const STEPS = [
  {
    icon: Store,
    title: "See it in person",
    text: "Visit the store to feel the material, check the size and compare pieces side by side before you choose.",
  },
  {
    icon: QrCode,
    title: "Scan in-store",
    text: "Each product carries its own QR code. Scan it to see photos, features and specifications on your phone.",
  },
  {
    icon: MessageCircle,
    title: "Ask before you visit",
    text: "Enquire about any piece on WhatsApp or call us directly — we're happy to help.",
  },
];

export async function StoreIntro() {
  const settings = await getStoreSettings();

  return (
    <section
      aria-labelledby="intro-heading"
      className="border-y border-line bg-paper py-16 sm:py-24"
    >
      <Container className="grid gap-12 lg:grid-cols-12 lg:gap-16">
        <Reveal className="lg:col-span-5">
          <p className="text-eyebrow text-gold-deep">The showroom</p>
          <h2
            id="intro-heading"
            className="mt-4 font-display text-3xl leading-tight font-medium text-ink sm:text-4xl"
          >
            A local store for bags you can trust.
          </h2>
          <p className="mt-5 leading-relaxed text-muted">
            {settings.store_name} is a physical retail showroom
            {settings.city ? ` in ${settings.city}` : ""} for trolley bags, school bags and ladies
            purses. This website is our digital showroom — browse the range from anywhere, then come
            and see it for yourself.
          </p>
          <Link
            href="/about"
            className="mt-7 inline-flex border-b border-ink/30 pb-1 text-sm font-medium text-ink transition-colors hover:border-gold"
          >
            More about us
          </Link>
        </Reveal>

        <ol className="grid gap-px overflow-hidden rounded-(--radius-card) border border-line bg-line sm:grid-cols-3 lg:col-span-7 lg:grid-cols-1 xl:grid-cols-3">
          {STEPS.map((step, index) => (
            <Reveal as="li" key={step.title} delay={index * 0.08} className="bg-paper p-7">
              <step.icon aria-hidden className="size-6 text-gold-deep" strokeWidth={1.5} />
              <h3 className="mt-5 font-display text-lg text-ink">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{step.text}</p>
            </Reveal>
          ))}
        </ol>
      </Container>
    </section>
  );
}
