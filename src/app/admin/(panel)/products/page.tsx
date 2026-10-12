import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AdminPageTitle } from "@/components/admin/page-title";
import { ProductTable, type ProductFilter } from "@/components/admin/product-table";
import { buttonClasses } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth/admin";
import { listAdminProducts } from "@/lib/data/admin";

// Reads the session on every request, so it blocks instead of prerendering.
export const instant = false;

export const metadata: Metadata = { title: "Products" };

const FILTERS: ProductFilter[] = ["all", "active", "inactive", "featured", "new"];

export default async function AdminProductsPage({ searchParams }: PageProps<"/admin/products">) {
  const { supabase } = await requireAdmin("/admin/products");
  const [products, params] = await Promise.all([listAdminProducts(supabase), searchParams]);
  const requested = typeof params.filter === "string" ? params.filter : "all";
  const filter = FILTERS.includes(requested as ProductFilter)
    ? (requested as ProductFilter)
    : "all";

  return (
    <>
      <AdminPageTitle
        title="Products"
        description={`${products.length} product${products.length === 1 ? "" : "s"} in the showroom catalogue.`}
        actions={
          <Link href="/admin/products/new" className={buttonClasses({ size: "sm" })}>
            <Plus aria-hidden className="size-4" /> Add product
          </Link>
        }
      />
      <ProductTable products={products} initialFilter={filter} />
    </>
  );
}
