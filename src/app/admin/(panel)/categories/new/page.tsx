import type { Metadata } from "next";
import { CategoryForm } from "@/components/admin/category-form";
import { AdminPageTitle } from "@/components/admin/page-title";
import { requireAdmin } from "@/lib/auth/admin";

// Reads the session on every request, so it blocks instead of prerendering.
export const instant = false;

export const metadata: Metadata = { title: "Add category" };

export default async function NewCategoryPage() {
  await requireAdmin("/admin/categories/new");
  return (
    <>
      <AdminPageTitle title="Add category" />
      <CategoryForm />
    </>
  );
}
