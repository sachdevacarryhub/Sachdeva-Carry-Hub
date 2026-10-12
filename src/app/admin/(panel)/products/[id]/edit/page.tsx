import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminPageTitle } from "@/components/admin/page-title";
import { ProductForm } from "@/components/admin/product-form";
import { isUuid } from "@/lib/api/http";
import { requireAdmin } from "@/lib/auth/admin";
import { getAdminProduct, listAdminCategories } from "@/lib/data/admin";

// Reads the session on every request, so it blocks instead of prerendering.
export const instant = false;

export const metadata: Metadata = { title: "Edit product" };

export default async function EditProductPage({ params }: PageProps<"/admin/products/[id]/edit">) {
  const { id } = await params;
  const { supabase } = await requireAdmin(`/admin/products/${id}/edit`);
  if (!isUuid(id)) notFound();

  const [product, categories] = await Promise.all([
    getAdminProduct(supabase, id),
    listAdminCategories(supabase),
  ]);
  if (!product) notFound();

  return (
    <>
      <AdminPageTitle title="Edit product" description={product.name} />
      {/* key resets the form when navigating between products */}
      <ProductForm
        key={`${product.id}-${product.updated_at}`}
        product={product}
        categories={categories.map(({ id: cid, name, slug, is_active }) => ({
          id: cid,
          name,
          slug,
          is_active,
        }))}
      />
    </>
  );
}
