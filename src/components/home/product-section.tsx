import { PackageOpen } from "lucide-react";
import { ProductGrid } from "@/components/products/product-grid";
import { Reveal } from "@/components/shared/reveal";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeading } from "@/components/ui/section-heading";
import { getFeaturedProducts, getNewArrivals, type Loaded } from "@/lib/data/public";
import { cn } from "@/lib/utils/cn";
import type { ProductCardData } from "@/types";

interface ProductSectionProps {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  result: Loaded<ProductCardData[]>;
  emptyText: string;
  className?: string;
}

function ProductSection({
  id,
  eyebrow,
  title,
  description,
  href,
  result,
  emptyText,
  className,
}: ProductSectionProps) {
  return (
    <section aria-labelledby={id} className={cn("py-16 sm:py-24", className)}>
      <Container>
        <SectionHeading
          eyebrow={eyebrow}
          title={<span id={id}>{title}</span>}
          description={description}
          action={result.ok && result.data.length > 0 ? { href, label: "View all" } : undefined}
        />
        <Reveal className="mt-10 sm:mt-12">
          {!result.ok ? (
            <EmptyState
              title="Products are taking a moment"
              description="We couldn't load this collection right now. Please refresh the page in a little while."
            />
          ) : result.data.length === 0 ? (
            <EmptyState
              icon={<PackageOpen className="size-6" strokeWidth={1.5} />}
              title="Coming soon"
              description={emptyText}
            />
          ) : (
            <ProductGrid products={result.data} />
          )}
        </Reveal>
      </Container>
    </section>
  );
}

export async function FeaturedCollection() {
  const result = await getFeaturedProducts(8);
  return (
    <ProductSection
      id="featured-heading"
      eyebrow="Handpicked"
      title="Featured Collection"
      description="Pieces we recommend from the showroom floor."
      href="/products?featured=1"
      result={result}
      emptyText="Our featured pieces will appear here soon. Meanwhile, visit the store to see the full range."
      className="border-t border-line bg-paper"
    />
  );
}

export async function NewArrivals() {
  const result = await getNewArrivals(8);
  return (
    <ProductSection
      id="new-arrivals-heading"
      eyebrow="Just in"
      title="New Arrivals"
      description="The latest additions to the store."
      href="/products?new=1"
      result={result}
      emptyText="New arrivals will be listed here as soon as they reach the store."
    />
  );
}
