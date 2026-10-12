import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CategoryForm } from "@/components/admin/category-form";
import { AdminPageTitle } from "@/components/admin/page-title";
import { isUuid } from "@/lib/api/http";
import { requireAdmin } from "@/lib/auth/admin";
import { getAdminCategory } from "@/lib/data/admin";

// Reads the session on every request, so it blocks instead of prerendering.
export const instant = false;

export const metadata: Metadata = { title: "Edit category" };

export default async function EditCategoryPage({
  params,
}: PageProps<"/admin/categories/[id]/edit">) {
  const { id } = await params;
  const { supabase } = await requireAdmin(`/admin/categories/${id}/edit`);
  if (!isUuid(id)) notFound();

  const category = await getAdminCategory(supabase, id);
  if (!category) notFound();

  return (
    <>
      <AdminPageTitle title="Edit category" description={category.name} />
      <CategoryForm key={category.updated_at} category={category} />
    </>
  );
}
