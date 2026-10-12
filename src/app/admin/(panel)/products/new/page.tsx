import type { Metadata } from "next";
import { AdminPageTitle } from "@/components/admin/page-title";
import { ProductForm } from "@/components/admin/product-form";
import { requireAdmin } from "@/lib/auth/admin";
import { listAdminCategories } from "@/lib/data/admin";

// Reads the session on every request, so it blocks instead of prerendering.
export const instant = false;

export const metadata: Metadata = { title: "Add product" };

export default async function NewProductPage() {
  const { supabase } = await requireAdmin("/admin/products/new");
  const categories = await listAdminCategories(supabase);

  return (
    <>
      <AdminPageTitle
        title="Add product"
        description="Create a new product for the showroom catalogue."
      />
      <ProductForm
        categories={categories.map(({ id, name, slug, is_active }) => ({
          id,
          name,
          slug,
          is_active,
        }))}
      />
    </>
  );
}
