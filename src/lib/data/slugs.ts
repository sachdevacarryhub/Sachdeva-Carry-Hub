import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { nextAvailableSlug, slugify } from "@/lib/utils/slug";

/**
 * Returns a unique slug for `table`, appending -2, -3, ... when needed.
 * `excludeId` lets a record keep its own slug on update.
 * The UNIQUE constraint remains the final guard against races.
 */
export async function resolveUniqueSlug(
  supabase: SupabaseClient,
  table: "products" | "categories",
  desired: string | null | undefined,
  fallbackSource: string,
  excludeId?: string,
): Promise<{ ok: true; slug: string } | { ok: false }> {
  const base = slugify(desired || fallbackSource) || "item";

  // `base` matches ^[a-z0-9-]+$ so it is safe inside a PostgREST filter.
  let query = supabase.from(table).select("id, slug").or(`slug.eq.${base},slug.like.${base}-*`);
  if (excludeId) query = query.neq("id", excludeId);

  const { data, error } = await query;
  if (error) {
    console.error(`[slug:${table}]`, error.code, error.message);
    return { ok: false };
  }

  return {
    ok: true,
    slug: nextAvailableSlug(
      base,
      (data ?? []).map((row) => String(row.slug)),
    ),
  };
}
