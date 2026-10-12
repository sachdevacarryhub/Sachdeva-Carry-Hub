import type { NextRequest } from "next/server";
import {
  databaseError,
  guardAdmin,
  isUuid,
  jsonError,
  jsonOk,
  parseJsonBody,
} from "@/lib/api/http";
import { getAdminStatus } from "@/lib/auth/admin";
import { destroyImages } from "@/lib/cloudinary/server";
import { getAdminProduct } from "@/lib/data/admin";
import { PRODUCT_FULL_SELECT, toProduct } from "@/lib/data/mappers";
import { revalidateProducts } from "@/lib/data/revalidate";
import { resolveUniqueSlug } from "@/lib/data/slugs";
import { createServerSupabase } from "@/lib/supabase/server";
import { productFlagsSchema, productInputSchema } from "@/lib/validations/product";

type Context = RouteContext<"/api/products/[id]">;

/**
 * GET /api/products/[id]
 * Admins receive any product; everyone else only active, public products
 * (enforced by Row Level Security on the caller's own session).
 */
export async function GET(_request: NextRequest, { params }: Context) {
  const { id } = await params;
  if (!isUuid(id)) return jsonError(400, "Invalid product id.");

  const status = await getAdminStatus();
  if (status.status === "admin") {
    try {
      const product = await getAdminProduct(status.supabase, id);
      return product ? jsonOk({ product }) : jsonError(404, "Product not found.");
    } catch {
      return jsonError(500, "Could not load the product.");
    }
  }

  const supabase = await createServerSupabase();
  if (!supabase) return jsonError(503, "Products are temporarily unavailable.");
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_FULL_SELECT)
    .eq("id", id)
    .eq("is_active", true)
    .maybeSingle();
  if (error) return databaseError(error, "product-get");
  return data ? jsonOk({ product: toProduct(data) }) : jsonError(404, "Product not found.");
}

/**
 * PATCH /api/products/[id] (admin only)
 * - Full update: body includes `images` (form save, incl. gallery order/primary).
 * - Quick toggle: { is_featured?, is_new_arrival?, is_active? }.
 */
export async function PATCH(request: NextRequest, { params }: Context) {
  const guard = await guardAdmin(request);
  if (!guard.ok) return guard.response;
  const { supabase } = guard.admin;

  const { id } = await params;
  if (!isUuid(id)) return jsonError(400, "Invalid product id.");

  let raw: unknown;
  try {
    raw = await request.clone().json();
  } catch {
    return jsonError(400, "Request body must be valid JSON.");
  }
  const isFullUpdate = typeof raw === "object" && raw !== null && "images" in raw;

  if (!isFullUpdate) {
    const body = await parseJsonBody(request, productFlagsSchema);
    if (!body.ok) return body.response;

    const { data, error } = await supabase
      .from("products")
      .update(body.data)
      .eq("id", id)
      .select("id")
      .maybeSingle();
    if (error) return databaseError(error, "product-flags");
    if (!data) return jsonError(404, "Product not found.");

    revalidateProducts();
    return jsonOk({ id });
  }

  const body = await parseJsonBody(request, productInputSchema);
  if (!body.ok) return body.response;
  const { images, slug: desiredSlug, ...product } = body.data;

  const slug = await resolveUniqueSlug(supabase, "products", desiredSlug, product.name, id);
  if (!slug.ok) return jsonError(500, "Could not verify the product URL. Please try again.");

  const { data, error } = await supabase
    .rpc("save_product", {
      p_id: id,
      p_product: { ...product, slug: slug.slug },
      p_images: images,
    })
    .single<{ saved_id: string; saved_slug: string; removed_public_ids: string[] | null }>();

  if (error) return databaseError(error, "product-update");

  // Assets are removed only after the database change has committed.
  await destroyImages(data.removed_public_ids ?? []);

  revalidateProducts();
  return jsonOk({ id: data.saved_id, slug: data.saved_slug });
}

/**
 * DELETE /api/products/[id] (admin only)
 *
 * Order: verify admin -> read image ids -> delete product (image rows cascade)
 * -> delete Cloudinary assets. Deleting the record first means a Cloudinary
 * failure can never leave a live product pointing at missing images; failed
 * asset deletions are logged server-side.
 */
export async function DELETE(request: NextRequest, { params }: Context) {
  const guard = await guardAdmin(request);
  if (!guard.ok) return guard.response;
  const { supabase } = guard.admin;

  const { id } = await params;
  if (!isUuid(id)) return jsonError(400, "Invalid product id.");

  const { data: images, error: imagesError } = await supabase
    .from("product_images")
    .select("cloudinary_public_id")
    .eq("product_id", id);
  if (imagesError) return databaseError(imagesError, "product-delete-images");

  const { data, error } = await supabase
    .from("products")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();
  if (error) return databaseError(error, "product-delete");
  if (!data) return jsonError(404, "Product not found.");

  await destroyImages(images.map((image) => String(image.cloudinary_public_id)));

  revalidateProducts();
  return jsonOk({ id });
}
