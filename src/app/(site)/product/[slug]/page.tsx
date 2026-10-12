import { MapPin } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/layout/page-header";
import {
  ColorSwatches,
  FeatureList,
  ProductDescription,
  SpecificationTable,
} from "@/components/products/product-details";
import { ProductGallery } from "@/components/products/product-gallery";
import { ProductGrid } from "@/components/products/product-grid";
import { bagKindFor } from "@/components/shared/bag-illustration";
import { CallButton, WhatsAppButton } from "@/components/shared/contact-buttons";
import { JsonLd } from "@/components/shared/json-ld";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeading } from "@/components/ui/section-heading";
import {
  getProductBySlug,
  getPublicSlugs,
  getRelatedProducts,
  getStoreSettings,
} from "@/lib/data/public";
import { PLACEHOLDER_SLUG } from "@/lib/data/static-params";
import { cloudinaryTransform } from "@/lib/cloudinary/url";
import { absoluteUrl } from "@/lib/env";
import {
  fullAddress,
  mapsDirectionsUrl,
  productEnquiryMessage,
  whatsappNumber,
} from "@/lib/utils/contact";
import { truncate } from "@/lib/utils/format";
import { SLUG_PATTERN } from "@/lib/utils/slug";

// Fully static (cached data only): unknown slugs render completely before the
// response starts, so notFound() returns a real HTTP 404.
export const ensureStatic = "navigation";

export async function generateStaticParams() {
  const { products } = await getPublicSlugs();
  return products.length
    ? products.map((product) => ({ slug: product.slug }))
    : [{ slug: PLACEHOLDER_SLUG }];
}

async function loadProduct(slug: string) {
  if (!SLUG_PATTERN.test(slug)) return { ok: true as const, data: null };
  return getProductBySlug(slug);
}

export async function generateMetadata({
  params,
}: PageProps<"/product/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const result = await loadProduct(slug);
  if (!result.ok || !result.data) return { title: "Product not found", robots: { index: false } };

  const product = result.data;
  const description = truncate(
    product.short_description ??
      product.description ??
      `${product.name}${product.category ? ` — ${product.category.name}` : ""}. Available at our showroom.`,
    160,
  );
  const image = product.images.find((img) => img.is_primary) ?? product.images[0];
  const path = `/product/${product.slug}`;

  return {
    title: product.name,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: product.name,
      description,
      url: path,
      ...(image && {
        images: [
          {
            url: cloudinaryTransform(image.image_url, "f_jpg,q_auto,c_fill,w_1200,h_630"),
            width: 1200,
            height: 630,
            alt: image.alt_text ?? product.name,
          },
        ],
      }),
    },
    twitter: { card: image ? "summary_large_image" : "summary", title: product.name, description },
  };
}

export default async function ProductPage({ params }: PageProps<"/product/[slug]">) {
  const { slug } = await params;
  const [result, settings] = await Promise.all([loadProduct(slug), getStoreSettings()]);

  if (!result.ok) {
    return (
      <Container className="py-20">
        <EmptyState
          title="This product is temporarily unavailable"
          description="We couldn't load the product details right now. Please try again shortly."
        />
      </Container>
    );
  }
  // Missing, inactive, or in an inactive category -> 404 (RLS hides it).
  if (!result.data) notFound();
  const product = result.data;

  const related = product.category_id
    ? await getRelatedProducts(product.category_id, product.id)
    : [];

  const productUrl = absoluteUrl(`/product/${product.slug}`);
  const message = productEnquiryMessage(product.name, productUrl);
  const whatsapp = whatsappNumber(settings);
  const fallbackKind = bagKindFor(product.category?.slug ?? product.name);
  const address = fullAddress(settings);
  const directions = mapsDirectionsUrl(settings);

  const crumbs = [
    { href: "/", label: "Home" },
    { href: "/products", label: "Products" },
    ...(product.category
      ? [{ href: `/category/${product.category.slug}`, label: product.category.name }]
      : []),
    { label: product.name },
  ];

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: crumb.label,
      ...(crumb.href && absoluteUrl(crumb.href) ? { item: absoluteUrl(crumb.href) } : {}),
      ...(!crumb.href && productUrl ? { item: productUrl } : {}),
    })),
  };

  return (
    <div className="pb-24 sm:pb-0">
      <JsonLd data={breadcrumbLd} />
      <Container className="pt-6 pb-16 sm:pt-10 lg:pb-24">
        <Breadcrumbs items={crumbs} />

        <div className="mt-6 grid gap-10 lg:mt-10 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-7">
            <div className="lg:sticky lg:top-24">
              <ProductGallery
                productName={product.name}
                fallbackKind={fallbackKind}
                images={product.images.map((image, i) => ({
                  id: image.id,
                  src: image.image_url,
                  alt: image.alt_text || `${product.name} — image ${i + 1}`,
                }))}
              />
            </div>
          </div>

          <div className="lg:col-span-5">
            {product.category && (
              <Link
                href={`/category/${product.category.slug}`}
                className="text-eyebrow text-gold-deep hover:text-ink"
              >
                {product.category.name}
              </Link>
            )}
            <h1 className="mt-3 font-display text-[2rem] leading-[1.15] font-medium tracking-tight text-ink sm:text-[2.6rem]">
              {product.name}
            </h1>

            {(product.is_new_arrival || product.is_featured) && (
              <div className="mt-4 flex gap-2">
                {product.is_new_arrival && (
                  <span className="rounded-md bg-ink px-2.5 py-1 text-[10px] font-semibold tracking-[0.16em] text-white uppercase">
                    New Arrival
                  </span>
                )}
                {product.is_featured && (
                  <span className="rounded-md border border-gold/60 px-2.5 py-1 text-[10px] font-semibold tracking-[0.16em] text-gold-deep uppercase">
                    Featured
                  </span>
                )}
              </div>
            )}

            {product.short_description && (
              <p className="mt-5 text-[17px] leading-relaxed text-ink/75">
                {product.short_description}
              </p>
            )}

            <div className="mt-7">
              <ColorSwatches colors={product.available_colors} />
            </div>

            <div className="mt-8 hidden flex-col gap-3 sm:flex sm:flex-row lg:flex-col xl:flex-row">
              <WhatsAppButton phone={whatsapp} message={message} className="flex-1" />
              <CallButton phone={settings.phone_primary} className="flex-1" />
            </div>

            <div className="mt-6 rounded-xl border border-line bg-paper p-4 text-sm text-muted">
              <p className="font-medium text-ink">Available at our showroom</p>
              {address && (
                <p className="mt-1.5 flex items-start gap-2">
                  <MapPin
                    aria-hidden
                    className="mt-0.5 size-4 shrink-0 text-gold-deep"
                    strokeWidth={1.75}
                  />
                  <span>
                    {address}
                    {directions && (
                      <>
                        {" · "}
                        <a
                          href={directions}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-ink underline underline-offset-4 hover:text-gold-deep"
                        >
                          Directions
                        </a>
                      </>
                    )}
                  </span>
                </p>
              )}
            </div>

            <div className="mt-8">
              <ProductDescription text={product.description} />
              <FeatureList features={product.features} />
              <SpecificationTable specifications={product.specifications} />
            </div>
          </div>
        </div>
      </Container>

      <section
        aria-labelledby="related-heading"
        className="border-t border-line bg-paper py-16 sm:py-20"
      >
        <Container>
          <SectionHeading
            eyebrow="Keep exploring"
            title={<span id="related-heading">Explore Other Products</span>}
            action={
              product.category
                ? {
                    href: `/category/${product.category.slug}`,
                    label: `All ${product.category.name}`,
                  }
                : { href: "/products", label: "All products" }
            }
          />
          {related.length > 0 ? (
            <ProductGrid products={related} className="mt-10" />
          ) : (
            <p className="mt-8 text-muted">
              <Link href="/products" className="font-medium text-ink underline underline-offset-4">
                Browse the full collection
              </Link>{" "}
              to see everything available at the store.
            </p>
          )}
        </Container>
      </section>

      {/* Mobile: enquiry actions always within thumb reach */}
      <div className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-line bg-cream/90 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md sm:hidden">
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <WhatsAppButton phone={whatsapp} message={message} size="md" />
          <CallButton phone={settings.phone_primary} label="Call" size="md" />
        </div>
      </div>
    </div>
  );
}
