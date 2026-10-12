"use client";

import { Search, SearchX, X } from "lucide-react";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils/cn";
import type { ProductCardData } from "@/types";
import { ProductGrid } from "./product-grid";

const chip =
  "inline-flex h-9 shrink-0 items-center rounded-lg border px-4 text-[13px] font-medium transition-colors";

/** Instant, in-browser search and filters within a single category. */
export function CategoryBrowser({ products }: { products: ProductCardData[] }) {
  const [query, setQuery] = useState("");
  const [featured, setFeatured] = useState(false);
  const [newArrival, setNewArrival] = useState(false);

  const visible = useMemo(() => {
    const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return products.filter((product) => {
      if (featured && !product.is_featured) return false;
      if (newArrival && !product.is_new_arrival) return false;
      const haystack = `${product.name} ${product.short_description ?? ""}`.toLowerCase();
      return terms.every((term) => haystack.includes(term));
    });
  }, [products, query, featured, newArrival]);

  const hasFilters = Boolean(query.trim() || featured || newArrival);
  const clear = () => {
    setQuery("");
    setFeatured(false);
    setNewArrival(false);
  };

  return (
    <div>
      <div className="flex flex-col gap-4 rounded-(--radius-card) border border-line bg-paper/80 p-3 shadow-(--shadow-card) backdrop-blur sm:flex-row sm:items-center sm:p-4">
        <div role="search" className="relative sm:w-80">
          <label htmlFor="category-search" className="sr-only">
            Search in this collection
          </label>
          <Search
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted"
          />
          <input
            id="category-search"
            type="search"
            autoComplete="off"
            maxLength={60}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search products..."
            className="h-11 w-full rounded-lg border border-line bg-cream/60 pr-3 pl-10 text-[15px] text-ink outline-none placeholder:text-muted focus:border-gold focus:bg-paper"
          />
        </div>
        <div role="group" aria-label="Filter products" className="flex flex-wrap gap-2">
          <button
            type="button"
            aria-pressed={featured}
            onClick={() => setFeatured((v) => !v)}
            className={cn(
              chip,
              featured
                ? "border-gold bg-gold-soft text-ink"
                : "border-line bg-paper text-ink/75 hover:border-ink/40",
            )}
          >
            Featured
          </button>
          <button
            type="button"
            aria-pressed={newArrival}
            onClick={() => setNewArrival((v) => !v)}
            className={cn(
              chip,
              newArrival
                ? "border-gold bg-gold-soft text-ink"
                : "border-line bg-paper text-ink/75 hover:border-ink/40",
            )}
          >
            New Arrivals
          </button>
          {hasFilters && (
            <button
              type="button"
              onClick={clear}
              className={cn(chip, "gap-1.5 border-transparent text-muted hover:text-ink")}
            >
              <X aria-hidden className="size-3.5" /> Clear filters
            </button>
          )}
        </div>
      </div>

      <div className="mt-8">
        {visible.length === 0 ? (
          <EmptyState
            icon={<SearchX className="size-6" strokeWidth={1.5} />}
            title="No products match your search"
            description="Try a different word or clear the filters."
            action={
              <button
                type="button"
                onClick={clear}
                className="text-sm font-medium text-ink underline underline-offset-4"
              >
                Clear filters
              </button>
            }
          />
        ) : (
          <>
            <p className="mb-6 text-sm text-muted" aria-live="polite">
              {visible.length} {visible.length === 1 ? "product" : "products"}
            </p>
            <ProductGrid products={visible} priorityCount={4} />
          </>
        )}
      </div>
    </div>
  );
}
