import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PackageOpen } from "lucide-react";
import { Breadcrumbs } from "@/components/layout/page-header";
import { CategoryBrowser } from "@/components/products/category-browser";
import { bagKindFor } from "@/components/shared/bag-illustration";
import { SmartImage } from "@/components/shared/smart-image";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { getCategoryBySlug, getPublicSlugs, searchProducts } from "@/lib/data/public";
import { PLACEHOLDER_SLUG } from "@/lib/data/static-params";
import { truncate } from "@/lib/utils/format";
import { SLUG_PATTERN } from "@/lib/utils/slug";

// Fully static (cached data only): unknown slugs render completely before the
// response starts, so notFound() returns a real HTTP 404.
export const ensureStatic = "navigation";

export async function generateStaticParams() {
  const { categories } = await getPublicSlugs();
  return categories.length
    ? categories.map((category) => ({ slug: category.slug }))
    : [{ slug: PLACEHOLDER_SLUG }];
}

async function loadCategory(slug: string) {
  if (!SLUG_PATTERN.test(slug)) return { ok: true as const, data: null };
  return getCategoryBySlug(slug);
}

export async function generateMetadata({
  params,
}: PageProps<"/category/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const result = await loadCategory(slug);
  if (!result.ok || !result.data) return { title: "Category not found", robots: { index: false } };

  const category = result.data;
  const description = truncate(
    category.description ?? `Explore ${category.name} available at our showroom.`,
    160,
  );
  return {
    title: category.name,
    description,
    alternates: { canonical: `/category/${category.slug}` },
    openGraph: {
      title: category.name,
      description,
      url: `/category/${category.slug}`,
      ...(category.image_url && { images: [{ url: category.image_url, alt: category.name }] }),
    },
  };
}

export default async function CategoryPage({ params }: PageProps<"/category/[slug]">) {
  const { slug } = await params;
  const result = await loadCategory(slug);

  if (!result.ok) {
    return (
      <Container className="py-20">
        <EmptyState
          title="This collection is temporarily unavailable"
          description="We couldn't load this category right now. Please try again shortly."
        />
      </Container>
    );
  }
  if (!result.data) notFound();
  const category = result.data;
  const products = await searchProducts({ category: category.slug });

  return (
    <>
      <section className="border-b border-line">
        <Container className="grid items-center gap-8 pt-8 pb-10 sm:pt-12 lg:grid-cols-12 lg:gap-12 lg:pb-14">
          <div className="lg:col-span-6">
            <Breadcrumbs
              items={[
                { href: "/", label: "Home" },
                { href: "/products", label: "Products" },
                { label: category.name },
              ]}
            />
            <p className="text-eyebrow mt-8 text-gold-deep">Collection</p>
            <h1 className="mt-3 font-display text-4xl leading-[1.1] font-medium tracking-tight text-ink sm:text-5xl">
              {category.name}
            </h1>
            {category.description && (
              <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-muted sm:text-base">
                {category.description}
              </p>
            )}
          </div>
          <div className="relative aspect-[16/10] overflow-hidden rounded-[20px] shadow-(--shadow-card) lg:col-span-6">
            <SmartImage
              src={category.image_url}
              alt={category.name}
              fill
              priority
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
              fallbackKind={bagKindFor(category.slug)}
              fallbackTone="dark"
            />
          </div>
        </Container>
      </section>

      <Container className="py-10 sm:py-14">
        {!products.ok ? (
          <EmptyState
            title="We couldn't load these products"
            description="Something went wrong on our side. Please refresh the page in a moment."
          />
        ) : products.data.length === 0 ? (
          <EmptyState
            icon={<PackageOpen className="size-6" strokeWidth={1.5} />}
            title="New products are on their way"
            description="This collection is being updated. Visit the store or message us on WhatsApp to see what's available today."
          />
        ) : (
          <CategoryBrowser products={products.data} />
        )}
      </Container>
    </>
  );
}
