import { FolderTree, Package, Plus, Sparkles, Star } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AdminPageTitle } from "@/components/admin/page-title";
import { ProductThumb } from "@/components/admin/product-thumb";
import { buttonClasses } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth/admin";
import { getDashboardStats, listAdminProducts } from "@/lib/data/admin";
import { formatDate } from "@/lib/utils/format";

// Reads the session on every request, so it blocks instead of prerendering.
export const instant = false;

export const metadata: Metadata = { title: "Dashboard" };

export default async function AdminDashboardPage() {
  const { supabase } = await requireAdmin("/admin");
  const [stats, recent] = await Promise.all([
    getDashboardStats(supabase),
    listAdminProducts(supabase, { limit: 6 }),
  ]);

  const cards = [
    {
      label: "Total Products",
      value: stats.totalProducts,
      note: `${stats.activeProducts} active`,
      icon: Package,
      href: "/admin/products",
    },
    {
      label: "Total Categories",
      value: stats.totalCategories,
      icon: FolderTree,
      href: "/admin/categories",
    },
    {
      label: "Featured Products",
      value: stats.featuredProducts,
      icon: Star,
      href: "/admin/products?filter=featured",
    },
    {
      label: "New Arrivals",
      value: stats.newArrivals,
      icon: Sparkles,
      href: "/admin/products?filter=new",
    },
  ];

  return (
    <>
      <AdminPageTitle
        title="Dashboard"
        description="An overview of your digital showroom."
        actions={
          <Link href="/admin/products/new" className={buttonClasses({ size: "sm" })}>
            <Plus aria-hidden className="size-4" /> Add product
          </Link>
        }
      />

      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <li key={card.label}>
            <Link
              href={card.href}
              className="block rounded-2xl border border-line bg-paper p-5 transition-shadow hover:shadow-(--shadow-card)"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted">{card.label}</p>
                <card.icon aria-hidden className="size-5 text-gold-deep" strokeWidth={1.75} />
              </div>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-ink">{card.value}</p>
              {card.note && <p className="mt-1 text-xs text-muted">{card.note}</p>}
            </Link>
          </li>
        ))}
      </ul>

      <section className="mt-10 rounded-2xl border border-line bg-paper">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="font-semibold text-ink">Recently added</h2>
          <Link
            href="/admin/products"
            className="text-sm font-medium text-gold-deep hover:text-ink"
          >
            All products
          </Link>
        </div>
        {recent.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-sm text-muted">No products yet.</p>
            <Link
              href="/admin/products/new"
              className={buttonClasses({ size: "sm", className: "mt-4" })}
            >
              Add your first product
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {recent.map((product) => (
              <li key={product.id}>
                <Link
                  href={`/admin/products/${product.id}/edit`}
                  className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-cream/60"
                >
                  <ProductThumb product={product} className="size-12" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-ink">{product.name}</p>
                    <p className="text-xs text-muted">
                      {product.category?.name ?? "No category"} · Added{" "}
                      {formatDate(product.created_at)}
                    </p>
                  </div>
                  {!product.is_active && (
                    <span className="rounded-md bg-ink/8 px-2 py-0.5 text-xs text-muted">
                      Inactive
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
