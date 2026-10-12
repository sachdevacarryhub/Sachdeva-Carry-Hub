import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { CategoryTable } from "@/components/admin/category-table";
import { AdminPageTitle } from "@/components/admin/page-title";
import { buttonClasses } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth/admin";
import { listAdminCategories } from "@/lib/data/admin";

// Reads the session on every request, so it blocks instead of prerendering.
export const instant = false;

export const metadata: Metadata = { title: "Categories" };

export default async function AdminCategoriesPage() {
  const { supabase } = await requireAdmin("/admin/categories");
  const categories = await listAdminCategories(supabase);

  return (
    <>
      <AdminPageTitle
        title="Categories"
        description="Organise the showroom collections. Deactivate a category to hide it without losing its products."
        actions={
          <Link href="/admin/categories/new" className={buttonClasses({ size: "sm" })}>
            <Plus aria-hidden className="size-4" /> Add category
          </Link>
        }
      />
      <CategoryTable categories={categories} />
    </>
  );
}
