"use client";

import { ExternalLink, Pencil, Trash } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { bagKindFor } from "@/components/shared/bag-illustration";
import { SmartImage } from "@/components/shared/smart-image";
import { apiRequest } from "@/lib/api/client";
import type { AdminCategory } from "@/lib/data/admin";
import { cn } from "@/lib/utils/cn";
import { ConfirmDialog } from "./confirm-dialog";

export function CategoryTable({ categories: initial }: { categories: AdminCategory[] }) {
  const router = useRouter();
  const [categories, setCategories] = useState(initial);
  const [syncedFrom, setSyncedFrom] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<AdminCategory | null>(null);
  const [deleting, setDeleting] = useState(false);

  if (initial !== syncedFrom) {
    setSyncedFrom(initial);
    setCategories(initial);
  }

  async function toggleActive(category: AdminCategory) {
    const next = !category.is_active;
    setBusy(category.id);
    setCategories((prev) =>
      prev.map((c) => (c.id === category.id ? { ...c, is_active: next } : c)),
    );
    const result = await apiRequest(`/api/categories/${category.id}`, {
      method: "PATCH",
      body: { is_active: next },
    });
    setBusy(null);
    if (!result.ok) {
      setCategories((prev) =>
        prev.map((c) => (c.id === category.id ? { ...c, is_active: !next } : c)),
      );
      toast.error(result.error);
      return;
    }
    toast.success(
      next
        ? `“${category.name}” is visible on the website`
        : `“${category.name}” and its products are hidden from the website`,
    );
    router.refresh();
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    const result = await apiRequest(`/api/categories/${toDelete.id}`, { method: "DELETE" });
    setDeleting(false);
    if (!result.ok) {
      toast.error(result.error);
      setToDelete(null);
      return;
    }
    toast.success(`“${toDelete.name}” was deleted`);
    setCategories((prev) => prev.filter((c) => c.id !== toDelete.id));
    setToDelete(null);
    router.refresh();
  }

  if (categories.length === 0) {
    return (
      <div className="rounded-2xl border border-line bg-paper px-5 py-14 text-center text-sm text-muted">
        No categories yet.
      </div>
    );
  }

  return (
    <>
      <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {categories.map((category) => (
          <li key={category.id} className="overflow-hidden rounded-2xl border border-line bg-paper">
            <div className="relative aspect-[16/9] bg-cream-deep">
              <SmartImage
                src={category.image_url}
                alt=""
                fill
                sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
                className="object-cover"
                fallbackKind={bagKindFor(category.slug)}
              />
              {!category.is_active && (
                <span className="absolute top-3 left-3 rounded-md bg-ink/85 px-2 py-1 text-[11px] font-medium text-white">
                  Inactive
                </span>
              )}
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate font-semibold text-ink">{category.name}</h2>
                  <p className="truncate text-xs text-muted">/category/{category.slug}</p>
                </div>
                <span className="shrink-0 rounded-md bg-cream px-2 py-1 text-xs text-muted">
                  {category.product_count} product{category.product_count === 1 ? "" : "s"}
                </span>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
                <label className="flex items-center gap-2 text-sm text-muted">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={category.is_active}
                    aria-label={`Active: ${category.name}`}
                    onClick={() => toggleActive(category)}
                    disabled={busy === category.id}
                    className={cn(
                      "relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-50",
                      category.is_active ? "bg-ink" : "bg-ink/15",
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "inline-block size-4 rounded-full bg-paper shadow transition-transform",
                        category.is_active ? "translate-x-[18px]" : "translate-x-0.5",
                      )}
                    />
                  </button>
                  Active
                </label>
                <div className="flex">
                  {category.is_active && (
                    <a
                      href={`/category/${category.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`View ${category.name} on the website`}
                      className="flex size-9 items-center justify-center rounded-lg text-muted hover:bg-ink/5 hover:text-ink"
                    >
                      <ExternalLink aria-hidden className="size-4" />
                    </a>
                  )}
                  <Link
                    href={`/admin/categories/${category.id}/edit`}
                    aria-label={`Edit ${category.name}`}
                    className="flex size-9 items-center justify-center rounded-lg text-muted hover:bg-ink/5 hover:text-ink"
                  >
                    <Pencil aria-hidden className="size-4" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => setToDelete(category)}
                    aria-label={`Delete ${category.name}`}
                    className="flex size-9 items-center justify-center rounded-lg text-muted hover:bg-danger/10 hover:text-danger"
                  >
                    <Trash aria-hidden className="size-4" />
                  </button>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <ConfirmDialog
        open={toDelete !== null}
        title={
          toDelete && toDelete.product_count > 0
            ? "This category has products"
            : "Delete this category?"
        }
        description={
          toDelete && toDelete.product_count > 0 ? (
            <>
              <strong className="text-ink">{toDelete.name}</strong> still has{" "}
              {toDelete.product_count} product{toDelete.product_count === 1 ? "" : "s"}. Move them
              to another category or delete them first. To hide it from the website, switch it to
              inactive instead.
            </>
          ) : (
            <>
              <strong className="text-ink">{toDelete?.name}</strong> will be permanently deleted.
            </>
          )
        }
        confirmLabel={toDelete && toDelete.product_count > 0 ? "Try anyway" : "Delete"}
        pending={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </>
  );
}
