import type { NextRequest } from "next/server";
import {
  databaseError,
  guardAdmin,
  isUuid,
  jsonError,
  jsonOk,
  parseJsonBody,
} from "@/lib/api/http";
import { destroyImage } from "@/lib/cloudinary/server";
import { CATEGORY_SELECT, toCategory } from "@/lib/data/mappers";
import { revalidateCategories } from "@/lib/data/revalidate";
import { resolveUniqueSlug } from "@/lib/data/slugs";
import { createServerSupabase } from "@/lib/supabase/server";
import { categoryInputSchema, categoryPatchSchema } from "@/lib/validations/category";

type Context = RouteContext<"/api/categories/[id]">;

/** GET /api/categories/[id] — RLS returns inactive categories to admins only. */
export async function GET(_request: NextRequest, { params }: Context) {
  const { id } = await params;
  if (!isUuid(id)) return jsonError(400, "Invalid category id.");

  const supabase = await createServerSupabase();
  if (!supabase) return jsonError(503, "Categories are temporarily unavailable.");

  const { data, error } = await supabase
    .from("categories")
    .select(CATEGORY_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) return databaseError(error, "category-get");
  return data ? jsonOk({ category: toCategory(data) }) : jsonError(404, "Category not found.");
}

/**
 * PATCH /api/categories/[id] (admin only)
 * Full update (body has `name`) or quick toggle ({ is_active?, sort_order? }).
 */
export async function PATCH(request: NextRequest, { params }: Context) {
  const guard = await guardAdmin(request);
  if (!guard.ok) return guard.response;
  const { supabase } = guard.admin;

  const { id } = await params;
  if (!isUuid(id)) return jsonError(400, "Invalid category id.");

  let raw: unknown;
  try {
    raw = await request.clone().json();
  } catch {
    return jsonError(400, "Request body must be valid JSON.");
  }
  const isFullUpdate = typeof raw === "object" && raw !== null && "name" in raw;

  if (!isFullUpdate) {
    const body = await parseJsonBody(request, categoryPatchSchema);
    if (!body.ok) return body.response;
    const { data, error } = await supabase
      .from("categories")
      .update(body.data)
      .eq("id", id)
      .select("id")
      .maybeSingle();
    if (error) return databaseError(error, "category-toggle");
    if (!data) return jsonError(404, "Category not found.");
    revalidateCategories();
    return jsonOk({ id });
  }

  const body = await parseJsonBody(request, categoryInputSchema);
  if (!body.ok) return body.response;
  const { slug: desiredSlug, ...category } = body.data;

  const { data: existing, error: existingError } = await supabase
    .from("categories")
    .select("image_public_id")
    .eq("id", id)
    .maybeSingle();
  if (existingError) return databaseError(existingError, "category-read");
  if (!existing) return jsonError(404, "Category not found.");

  const slug = await resolveUniqueSlug(supabase, "categories", desiredSlug, category.name, id);
  if (!slug.ok) return jsonError(500, "Could not verify the category URL. Please try again.");

  const { data, error } = await supabase
    .from("categories")
    .update({ ...category, slug: slug.slug })
    .eq("id", id)
    .select("id, slug")
    .single();
  if (error) return databaseError(error, "category-update");

  // Replaced or removed image: clean up the old asset after the update.
  const previousImage = existing.image_public_id as string | null;
  if (previousImage && previousImage !== category.image_public_id) {
    await destroyImage(previousImage);
  }

  revalidateCategories();
  return jsonOk({ id: data.id as string, slug: data.slug as string });
}

/**
 * DELETE /api/categories/[id] (admin only)
 * Refuses to delete a category that still has products (no silent breakage).
 */
export async function DELETE(request: NextRequest, { params }: Context) {
  const guard = await guardAdmin(request);
  if (!guard.ok) return guard.response;
  const { supabase } = guard.admin;

  const { id } = await params;
  if (!isUuid(id)) return jsonError(400, "Invalid category id.");

  const { count, error: countError } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("category_id", id);
  if (countError) return databaseError(countError, "category-delete-count");
  if ((count ?? 0) > 0) {
    return jsonError(
      409,
      `This category has ${count} product${count === 1 ? "" : "s"}. Move or delete them first, or deactivate the category instead.`,
    );
  }

  const { data, error } = await supabase
    .from("categories")
    .delete()
    .eq("id", id)
    .select("id, image_public_id")
    .maybeSingle();
  if (error) return databaseError(error, "category-delete");
  if (!data) return jsonError(404, "Category not found.");

  if (data.image_public_id) await destroyImage(String(data.image_public_id));

  revalidateCategories();
  return jsonOk({ id });
}
