import type { NextRequest } from "next/server";
import { databaseError, guardAdmin, jsonError, jsonOk, parseJsonBody } from "@/lib/api/http";
import { getActiveCategories } from "@/lib/data/public";
import { revalidateCategories } from "@/lib/data/revalidate";
import { resolveUniqueSlug } from "@/lib/data/slugs";
import { categoryInputSchema } from "@/lib/validations/category";

/** GET /api/categories — active categories (public). */
export async function GET() {
  const result = await getActiveCategories();
  if (!result.ok) return jsonError(503, "Categories are temporarily unavailable.");
  return Response.json(
    { categories: result.data },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } },
  );
}

/** POST /api/categories — create a category (admin only). */
export async function POST(request: NextRequest) {
  const guard = await guardAdmin(request);
  if (!guard.ok) return guard.response;
  const { supabase } = guard.admin;

  const body = await parseJsonBody(request, categoryInputSchema);
  if (!body.ok) return body.response;
  const { slug: desiredSlug, ...category } = body.data;

  const slug = await resolveUniqueSlug(supabase, "categories", desiredSlug, category.name);
  if (!slug.ok) return jsonError(500, "Could not verify the category URL. Please try again.");

  const { data, error } = await supabase
    .from("categories")
    .insert({ ...category, slug: slug.slug })
    .select("id, slug")
    .single();
  if (error) return databaseError(error, "category-create");

  revalidateCategories();
  return jsonOk({ id: data.id as string, slug: data.slug as string }, 201);
}
