import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { JsonLd, storeJsonLd } from "@/components/shared/json-ld";
import { Reveal } from "@/components/shared/reveal";
import { buttonClasses } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { getActiveCategories, getStoreSettings } from "@/lib/data/public";
import { formatDate } from "@/lib/utils/format";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getStoreSettings();
  return {
    title: "About Us",
    description: `${settings.store_name} is a physical retail showroom for trolley bags, school bags and ladies purses.`,
    alternates: { canonical: "/about" },
  };
}

const PROMISES = [
  {
    title: "A showroom, not just a website",
    text: "Everything you see here is meant to be seen in person. Come in, compare sizes and materials, and choose with confidence.",
  },
  {
    title: "Bags for every part of life",
    text: "Trolley bags for travel, school bags for the year ahead and purses for every day — under one roof.",
  },
  {
    title: "Straightforward help",
    text: "Have a question about a product? Message us on WhatsApp or call, and we'll answer directly.",
  },
];

export default async function AboutPage() {
  const [settings, categories] = await Promise.all([getStoreSettings(), getActiveCategories()]);
  const established = formatDate(settings.established_on);
  const categoryNames =
    categories.ok && categories.data.length
      ? categories.data.map((category) => category.name)
      : ["Trolley Bags", "School Bags", "Ladies Purses"];

  return (
    <>
      <JsonLd data={storeJsonLd(settings)} />
      <PageHeader
        eyebrow="About us"
        title={settings.store_name}
        description="A local bag showroom built on simple values: good products, honest advice and a store you can visit."
        breadcrumbs={[{ href: "/", label: "Home" }, { label: "About" }]}
      />

      <Container className="grid gap-12 py-14 sm:py-20 lg:grid-cols-12 lg:gap-16">
        <Reveal className="lg:col-span-7">
          <div className="space-y-5 text-[17px] leading-relaxed text-ink/80">
            <p>
              <span className="font-display text-2xl text-ink">{settings.store_name}</span> is a
              physical retail showroom{settings.city ? ` in ${settings.city}` : ""} specialising in{" "}
              {categoryNames
                .join(", ")
                .replace(/, ([^,]*)$/, " and $1")
                .toLowerCase()}
              .
            </p>
            <p>
              This website is our digital showroom. Browse the collection, look closely at photos,
              features and specifications, and when something catches your eye, ask us about it on
              WhatsApp, give us a call, or simply visit the store.
            </p>
            <p>
              Inside the showroom, every product has its own QR code. Scan it with your phone to
              open that product&apos;s page instantly.
            </p>
          </div>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link href="/products" className={buttonClasses({ size: "lg" })}>
              Explore Collection
            </Link>
            <Link href="/contact" className={buttonClasses({ variant: "secondary", size: "lg" })}>
              Visit Store
            </Link>
          </div>
        </Reveal>

        <Reveal delay={0.1} className="lg:col-span-5">
          <dl className="divide-y divide-line overflow-hidden rounded-(--radius-card) border border-line bg-paper">
            {settings.owner_name && (
              <div className="p-6">
                <dt className="text-eyebrow text-muted">Owner</dt>
                <dd className="mt-2 font-display text-xl text-ink">{settings.owner_name}</dd>
              </div>
            )}
            {established && (
              <div className="p-6">
                <dt className="text-eyebrow text-muted">Established</dt>
                <dd className="mt-2 font-display text-xl text-ink">{established}</dd>
              </div>
            )}
            <div className="p-6">
              <dt className="text-eyebrow text-muted">We stock</dt>
              <dd className="mt-3 flex flex-wrap gap-2">
                {categoryNames.map((name) => (
                  <span
                    key={name}
                    className="rounded-lg border border-line px-3 py-1.5 text-sm text-ink"
                  >
                    {name}
                  </span>
                ))}
              </dd>
            </div>
          </dl>
        </Reveal>
      </Container>

      <section
        aria-labelledby="values-heading"
        className="border-t border-line bg-paper py-14 sm:py-20"
      >
        <Container>
          <h2
            id="values-heading"
            className="font-display text-3xl font-medium text-ink sm:text-4xl"
          >
            What to expect
          </h2>
          <ul className="mt-10 grid gap-5 md:grid-cols-3">
            {PROMISES.map((item, index) => (
              <Reveal
                as="li"
                key={item.title}
                delay={index * 0.08}
                className="rounded-(--radius-card) border border-line bg-cream p-7"
              >
                <p className="text-eyebrow text-gold-deep">{String(index + 1).padStart(2, "0")}</p>
                <h3 className="mt-4 font-display text-xl text-ink">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">{item.text}</p>
              </Reveal>
            ))}
          </ul>
        </Container>
      </section>
    </>
  );
}
