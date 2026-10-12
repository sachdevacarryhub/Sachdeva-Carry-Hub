import { PackageOpen, SearchX } from "lucide-react";
import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton, ProductGridSkeleton } from "@/components/ui/skeleton";
import { searchProducts } from "@/lib/data/public";
import { productListQuerySchema } from "@/lib/validations/product";
import type { ProductSearchParams } from "@/types";
import { CatalogFilters, type CatalogFilterState } from "./catalog-filters";
import { ProductGrid } from "./product-grid";

type RawSearchParams = Record<string, string | string[] | undefined>;

/** Parses untrusted URL params into safe filters (invalid values are ignored). */
export function parseCatalogParams(raw: RawSearchParams): CatalogFilterState {
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
  const parsed = productListQuerySchema.safeParse({
    q: first(raw.q),
    category: first(raw.category),
    featured: first(raw.featured),
    new: first(raw.new),
  });
  if (!parsed.success) return { q: "", category: "", featured: false, newArrival: false };
  return {
    q: parsed.data.q ?? "",
    category: parsed.data.category ?? "",
    featured: Boolean(parsed.data.featured),
    newArrival: Boolean(parsed.data.new),
  };
}

interface CatalogProps {
  basePath: string;
  filters: CatalogFilterState;
  /** Category chips (catalogue page only). */
  categories?: { slug: string; name: string }[];
  /** Fixed category (category page). */
  lockedCategory?: string;
}

export async function Catalog({ basePath, filters, categories, lockedCategory }: CatalogProps) {
  const params: ProductSearchParams = {
    q: filters.q || undefined,
    category: lockedCategory ?? (filters.category || undefined),
    featured: filters.featured,
    newArrival: filters.newArrival,
  };
  const result = await searchProducts(params);
  const hasFilters = Boolean(
    filters.q || filters.category || filters.featured || filters.newArrival,
  );

  let content: React.ReactNode;
  if (!result.ok) {
    content = (
      <EmptyState
        title="We couldn't load the collection"
        description="Something went wrong on our side. Please refresh the page in a moment."
        action={
          <Link href={basePath} className={buttonClasses({ variant: "secondary", size: "sm" })}>
            Try again
          </Link>
        }
      />
    );
  } else if (result.data.length === 0) {
    content = hasFilters ? (
      <EmptyState
        icon={<SearchX className="size-6" strokeWidth={1.5} />}
        title="No products match your search"
        description={
          filters.q
            ? `We couldn't find anything for “${filters.q}”. Try a different word or clear the filters.`
            : "Try removing a filter to see more products."
        }
        action={
          <Link href={basePath} className={buttonClasses({ variant: "secondary", size: "sm" })}>
            Clear filters
          </Link>
        }
      />
    ) : (
      <EmptyState
        icon={<PackageOpen className="size-6" strokeWidth={1.5} />}
        title="New products are on their way"
        description="This collection is being updated. Visit the store or message us on WhatsApp to see what's available today."
      />
    );
  } else {
    content = (
      <>
        <p className="mb-6 text-sm text-muted" aria-live="polite">
          {result.data.length} {result.data.length === 1 ? "product" : "products"}
        </p>
        <ProductGrid products={result.data} priorityCount={4} />
      </>
    );
  }

  return (
    <CatalogFilters basePath={basePath} initial={filters} categories={categories}>
      {content}
    </CatalogFilters>
  );
}

export function CatalogSkeleton() {
  return (
    <div>
      <Skeleton className="h-[68px] rounded-(--radius-card)" />
      <Skeleton className="mt-8 mb-6 h-4 w-24" />
      <ProductGridSkeleton />
    </div>
  );
}
