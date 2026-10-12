"use client";

import { Search, TriangleAlert } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { QrCard } from "./qr-card";

export interface QrProduct {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  category: string | null;
}

export function QrGenerator({
  siteUrl,
  storeName,
  products,
  initialProductId,
}: {
  siteUrl: string;
  storeName: string;
  products: QrProduct[];
  initialProductId?: string;
}) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(
    products.some((p) => p.id === initialProductId) ? initialProductId : products[0]?.id,
  );
  const selected = products.find((product) => product.id === selectedId);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(q) ||
        product.slug.includes(q) ||
        (product.category?.toLowerCase().includes(q) ?? false),
    );
  }, [products, query]);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-line bg-paper p-5 sm:p-6">
        <h2 className="text-eyebrow mb-5 text-gold-deep">Website QR</h2>
        <QrCard
          title="Homepage"
          subtitle="For visiting cards, the shop counter, banners and packaging."
          url={`${siteUrl}/`}
          endpoint="/api/qr/site"
          printCaption={storeName}
          printSizeMm={70}
        />
      </section>

      <section className="rounded-2xl border border-line bg-paper p-5 sm:p-6">
        <h2 className="text-eyebrow mb-5 text-gold-deep">Product QR</h2>
        {products.length === 0 ? (
          <p className="text-sm text-muted">Add a product to generate its QR code.</p>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
            <div>
              <div className="relative">
                <label htmlFor="qr-product-search" className="sr-only">
                  Search products
                </label>
                <Search
                  aria-hidden
                  className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted"
                />
                <input
                  id="qr-product-search"
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search product"
                  className="h-10 w-full rounded-lg border border-line bg-cream/50 pr-3 pl-9 text-sm outline-none focus:border-gold"
                />
              </div>
              <ul
                role="listbox"
                aria-label="Products"
                className="mt-3 max-h-80 overflow-y-auto rounded-lg border border-line lg:max-h-[420px]"
              >
                {filtered.length === 0 && (
                  <li className="p-4 text-sm text-muted">No matching products.</li>
                )}
                {filtered.map((product) => {
                  const active = product.id === selectedId;
                  return (
                    <li key={product.id} role="option" aria-selected={active}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(product.id)}
                        className={cn(
                          "flex w-full flex-col items-start border-b border-line px-3 py-2.5 text-left last:border-b-0",
                          active ? "bg-ink text-white" : "hover:bg-cream",
                        )}
                      >
                        <span className="w-full truncate text-sm font-medium">{product.name}</span>
                        <span className={cn("text-xs", active ? "text-white/60" : "text-muted")}>
                          {product.category ?? "No category"}
                          {!product.is_active && " · Inactive"}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            {selected && (
              <div>
                {!selected.is_active && (
                  <p className="mb-5 flex gap-2 rounded-lg border border-gold/40 bg-gold-soft/50 p-3 text-sm text-ink">
                    <TriangleAlert aria-hidden className="size-4 shrink-0 text-gold-deep" />
                    This product is inactive. Its QR code will show a “not found” page until you
                    activate it.
                  </p>
                )}
                <QrCard
                  key={selected.id}
                  title={selected.name}
                  subtitle={selected.category ?? undefined}
                  url={`${siteUrl}/product/${selected.slug}`}
                  endpoint={`/api/qr/product/${selected.id}`}
                  printCaption={selected.name}
                />
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
