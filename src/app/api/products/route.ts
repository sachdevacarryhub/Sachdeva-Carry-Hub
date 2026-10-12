import type { NextRequest } from "next/server";
import { databaseError, guardAdmin, jsonError, jsonOk, parseJsonBody } from "@/lib/api/http";
import { searchProducts } from "@/lib/data/public";
import { revalidateProducts } from "@/lib/data/revalidate";
import { resolveUniqueSlug } from "@/lib/data/slugs";
import { productInputSchema, productListQuerySchema } from "@/lib/validations/product";

/**
 * GET /api/products — public catalogue (active products only).
 * Query: q, category (slug), featured=1, new=1
 */
export async function GET(request: NextRequest) {
  const parsed = productListQuerySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams.entries()),
  );
  if (!parsed.success) return jsonError(400, "Invalid query parameters.");

  const result = await searchProducts({
    q: parsed.data.q,
    category: parsed.data.category,
    featured: Boolean(parsed.data.featured),
    newArrival: Boolean(parsed.data.new),
  });
  if (!result.ok) return jsonError(503, "Products are temporarily unavailable.");

  return Response.json(
    { products: result.data },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } },
  );
}

/** POST /api/products — create a product with its gallery (admin only). */
export async function POST(request: NextRequest) {
  const guard = await guardAdmin(request);
  if (!guard.ok) return guard.response;
  const { supabase } = guard.admin;

  const body = await parseJsonBody(request, productInputSchema);
  if (!body.ok) return body.response;
  const { images, slug: desiredSlug, ...product } = body.data;

  const slug = await resolveUniqueSlug(supabase, "products", desiredSlug, product.name);
  if (!slug.ok) return jsonError(500, "Could not verify the product URL. Please try again.");

  const { data, error } = await supabase
    .rpc("save_product", {
      p_id: null,
      p_product: { ...product, slug: slug.slug },
      p_images: images,
    })
    .single<{ saved_id: string; saved_slug: string }>();

  if (error) return databaseError(error, "product-create");

  revalidateProducts();
  return jsonOk({ id: data.saved_id, slug: data.saved_slug }, 201);
}
