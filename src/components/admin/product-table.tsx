"use client";

import { ExternalLink, Pencil, QrCode, Search, Trash } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { apiRequest } from "@/lib/api/client";
import { cn } from "@/lib/utils/cn";
import type { Product } from "@/types";
import { ConfirmDialog } from "./confirm-dialog";
import { ProductThumb } from "./product-thumb";

export type ProductFilter = "all" | "active" | "inactive" | "featured" | "new";

const FILTERS: { value: ProductFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "featured", label: "Featured" },
  { value: "new", label: "New Arrivals" },
];

type Flag = "is_featured" | "is_new_arrival" | "is_active";

function Toggle({
  checked,
  label,
  onChange,
  disabled,
}: {
  checked: boolean;
  label: string;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      disabled={disabled}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors disabled:opacity-50",
        checked ? "bg-ink" : "bg-ink/15",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "inline-block size-4 rounded-full bg-paper shadow transition-transform",
          checked ? "translate-x-[18px]" : "translate-x-0.5",
        )}
      />
    </button>
  );
}

export function ProductTable({
  products: initialProducts,
  initialFilter = "all",
}: {
  products: Product[];
  initialFilter?: ProductFilter;
}) {
  const router = useRouter();
  const [products, setProducts] = useState(initialProducts);
  const [syncedFrom, setSyncedFrom] = useState(initialProducts);
  const [filter, setFilter] = useState<ProductFilter>(initialFilter);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState<Set<string>>(() => new Set());
  const [toDelete, setToDelete] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Adopt fresh server data after router.refresh().
  if (initialProducts !== syncedFrom) {
    setSyncedFrom(initialProducts);
    setProducts(initialProducts);
  }

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((product) => {
      if (filter === "active" && !product.is_active) return false;
      if (filter === "inactive" && product.is_active) return false;
      if (filter === "featured" && !product.is_featured) return false;
      if (filter === "new" && !product.is_new_arrival) return false;
      if (!q) return true;
      return (
        product.name.toLowerCase().includes(q) ||
        product.slug.includes(q) ||
        (product.category?.name.toLowerCase().includes(q) ?? false)
      );
    });
  }, [products, filter, query]);

  async function toggle(product: Product, flag: Flag) {
    const nextValue = !product[flag];
    setBusy((prev) => new Set(prev).add(product.id));
    setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, [flag]: nextValue } : p)));

    const result = await apiRequest(`/api/products/${product.id}`, {
      method: "PATCH",
      body: { [flag]: nextValue },
    });

    setBusy((prev) => {
      const next = new Set(prev);
      next.delete(product.id);
      return next;
    });

    if (!result.ok) {
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, [flag]: !nextValue } : p)),
      );
      toast.error(result.error);
      return;
    }
    const labels: Record<Flag, string> = {
      is_featured: nextValue ? "Marked as featured" : "Removed from featured",
      is_new_arrival: nextValue ? "Marked as new arrival" : "Removed from new arrivals",
      is_active: nextValue ? "Product is now active" : "Product is now hidden from the website",
    };
    toast.success(labels[flag]);
    router.refresh();
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    const result = await apiRequest(`/api/products/${toDelete.id}`, { method: "DELETE" });
    setDeleting(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setProducts((prev) => prev.filter((p) => p.id !== toDelete.id));
    toast.success(`“${toDelete.name}” was deleted`);
    setToDelete(null);
    router.refresh();
  }

  const actions = (product: Product) => (
    <div className="flex items-center gap-1">
      {product.is_active && (
        <a
          href={`/product/${product.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`View ${product.name} on the website`}
          title="View"
          className="flex size-9 items-center justify-center rounded-lg text-muted hover:bg-ink/5 hover:text-ink"
        >
          <ExternalLink aria-hidden className="size-4" />
        </a>
      )}
      <Link
        href={`/admin/products/${product.id}/edit`}
        aria-label={`Edit ${product.name}`}
        title="Edit"
        className="flex size-9 items-center justify-center rounded-lg text-muted hover:bg-ink/5 hover:text-ink"
      >
        <Pencil aria-hidden className="size-4" />
      </Link>
      <Link
        href={`/admin/qr?product=${product.id}`}
        aria-label={`Generate QR for ${product.name}`}
        title="Generate QR"
        className="flex size-9 items-center justify-center rounded-lg text-muted hover:bg-ink/5 hover:text-ink"
      >
        <QrCode aria-hidden className="size-4" />
      </Link>
      <button
        type="button"
        onClick={() => setToDelete(product)}
        aria-label={`Delete ${product.name}`}
        title="Delete"
        className="flex size-9 items-center justify-center rounded-lg text-muted hover:bg-danger/10 hover:text-danger"
      >
        <Trash aria-hidden className="size-4" />
      </button>
    </div>
  );

  return (
    <div className="rounded-2xl border border-line bg-paper">
      <div className="flex flex-col gap-3 border-b border-line p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative lg:w-72">
          <label htmlFor="admin-product-search" className="sr-only">
            Search products
          </label>
          <Search
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted"
          />
          <input
            id="admin-product-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, slug or category"
            className="h-10 w-full rounded-lg border border-line bg-cream/50 pr-3 pl-9 text-sm outline-none focus:border-gold"
          />
        </div>
        <div
          role="group"
          aria-label="Filter"
          className="flex scrollbar-none gap-1.5 overflow-x-auto"
        >
          {FILTERS.map((item) => (
            <button
              key={item.value}
              type="button"
              aria-pressed={filter === item.value}
              onClick={() => setFilter(item.value)}
              className={cn(
                "h-9 shrink-0 rounded-lg px-3 text-[13px] font-medium transition-colors",
                filter === item.value
                  ? "bg-ink text-white"
                  : "text-muted hover:bg-ink/5 hover:text-ink",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="px-5 py-14 text-center text-sm text-muted">
          {products.length === 0
            ? "No products yet. Add your first product."
            : "No products match these filters."}
        </p>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line text-xs tracking-wide text-muted uppercase">
                <tr>
                  <th scope="col" className="px-5 py-3 font-medium">
                    Product
                  </th>
                  <th scope="col" className="px-3 py-3 font-medium">
                    Category
                  </th>
                  <th scope="col" className="px-3 py-3 text-center font-medium">
                    Featured
                  </th>
                  <th scope="col" className="px-3 py-3 text-center font-medium">
                    New
                  </th>
                  <th scope="col" className="px-3 py-3 text-center font-medium">
                    Active
                  </th>
                  <th scope="col" className="px-5 py-3 text-right font-medium">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {visible.map((product) => {
                  const isBusy = busy.has(product.id);
                  return (
                    <tr key={product.id} className="hover:bg-cream/40">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <ProductThumb product={product} className="size-12" />
                          <div className="min-w-0">
                            <Link
                              href={`/admin/products/${product.id}/edit`}
                              className="block max-w-xs truncate font-medium text-ink hover:text-gold-deep"
                            >
                              {product.name}
                            </Link>
                            <p className="max-w-xs truncate text-xs text-muted">/{product.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-muted">{product.category?.name ?? "—"}</td>
                      <td className="px-3 py-3 text-center">
                        <Toggle
                          checked={product.is_featured}
                          label={`Featured: ${product.name}`}
                          onChange={() => toggle(product, "is_featured")}
                          disabled={isBusy}
                        />
                      </td>
                      <td className="px-3 py-3 text-center">
                        <Toggle
                          checked={product.is_new_arrival}
                          label={`New arrival: ${product.name}`}
                          onChange={() => toggle(product, "is_new_arrival")}
                          disabled={isBusy}
                        />
                      </td>
                      <td className="px-3 py-3 text-center">
                        <Toggle
                          checked={product.is_active}
                          label={`Active: ${product.name}`}
                          onChange={() => toggle(product, "is_active")}
                          disabled={isBusy}
                        />
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end">{actions(product)}</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <ul className="divide-y divide-line md:hidden">
            {visible.map((product) => {
              const isBusy = busy.has(product.id);
              return (
                <li key={product.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <ProductThumb product={product} />
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/admin/products/${product.id}/edit`}
                        className="block truncate font-medium text-ink"
                      >
                        {product.name}
                      </Link>
                      <p className="text-xs text-muted">
                        {product.category?.name ?? "No category"}
                      </p>
                      {!product.is_active && (
                        <span className="mt-1 inline-block rounded bg-ink/8 px-1.5 py-0.5 text-[11px] text-muted">
                          Inactive
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex gap-4 text-xs text-muted">
                      {(
                        [
                          ["is_featured", "Featured"],
                          ["is_new_arrival", "New"],
                          ["is_active", "Active"],
                        ] as const
                      ).map(([flag, label]) => (
                        <span key={flag} className="flex items-center gap-1.5">
                          <Toggle
                            checked={product[flag]}
                            label={`${label}: ${product.name}`}
                            onChange={() => toggle(product, flag)}
                            disabled={isBusy}
                          />
                          {label}
                        </span>
                      ))}
                    </div>
                    {actions(product)}
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}

      <ConfirmDialog
        open={toDelete !== null}
        title="Delete this product?"
        description={
          <>
            <strong className="text-ink">{toDelete?.name}</strong> and all of its images will be
            permanently deleted. Printed QR codes for this product will stop working. To hide it
            temporarily, switch it to inactive instead.
          </>
        }
        pending={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
