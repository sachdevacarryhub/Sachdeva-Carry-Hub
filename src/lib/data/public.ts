import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import type {
  Category,
  Product,
  ProductCardData,
  ProductSearchParams,
  StoreSettings,
} from "@/types";
import { CACHE_TAGS } from "./cache-tags";
import {
  CATEGORY_SELECT,
  EMPTY_STORE_SETTINGS,
  PRODUCT_CARD_SELECT,
  PRODUCT_FULL_SELECT,
  toCategory,
  toProduct,
  toProductCard,
  toStoreSettings,
} from "./mappers";

/**
 * Public, cached data access.
 *
 * Every function uses the cookie-less anon client, so Row Level Security only
 * exposes active categories/products. Results are cached and tagged; admin
 * mutations expire the tags (see src/lib/data/revalidate.ts).
 *
 * Failures return `{ ok: false }` with a short cache life so a temporary
 * outage heals itself quickly instead of being cached for hours.
 */

export type Loaded<T> = { ok: true; data: T } | { ok: false };

const FAILED = { ok: false } as const;

let warnedMissingSchema = false;

function logFailure(scope: string, error: { message?: string; code?: string } | null) {
  // PGRST205 = table not found: the database migration has not been applied yet.
  if (error?.code === "PGRST205") {
    if (!warnedMissingSchema) {
      warnedMissingSchema = true;
      console.warn(
        "[data] Supabase tables are missing. Run supabase/migrations/20261012000000_initial_schema.sql " +
          "in the Supabase SQL Editor (see README → Supabase setup). The site shows empty states until then.",
      );
    }
    return;
  }
  console.error(`[data:${scope}]`, error?.code ?? "", error?.message ?? "Supabase not configured");
}

// ---------------------------------------------------------------------------
// Store settings
// ---------------------------------------------------------------------------

export async function getStoreSettings(): Promise<StoreSettings> {
  "use cache";
  cacheTag(CACHE_TAGS.settings);

  const supabase = createPublicClient();
  if (!supabase) {
    cacheLife("minutes");
    return EMPTY_STORE_SETTINGS;
  }

  const { data, error } = await supabase.from("store_settings").select("*").limit(1).maybeSingle();
  if (error) {
    logFailure("settings", error);
    cacheLife("minutes");
    return EMPTY_STORE_SETTINGS;
  }

  cacheLife("hours");
  return toStoreSettings(data);
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export async function getActiveCategories(): Promise<Loaded<Category[]>> {
  "use cache";
  cacheTag(CACHE_TAGS.categories);

  const supabase = createPublicClient();
  if (!supabase) {
    cacheLife("minutes");
    return FAILED;
  }

  const { data, error } = await supabase
    .from("categories")
    .select(CATEGORY_SELECT)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    logFailure("categories", error);
    cacheLife("minutes");
    return FAILED;
  }

  cacheLife("hours");
  return { ok: true, data: data.map(toCategory) };
}

export async function getCategoryBySlug(slug: string): Promise<Loaded<Category | null>> {
  "use cache";
  cacheTag(CACHE_TAGS.categories);

  const supabase = createPublicClient();
  if (!supabase) {
    cacheLife("minutes");
    return FAILED;
  }

  const { data, error } = await supabase
    .from("categories")
    .select(CATEGORY_SELECT)
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    logFailure("category", error);
    cacheLife("minutes");
    return FAILED;
  }

  cacheLife("hours");
  return { ok: true, data: data ? toCategory(data) : null };
}

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

/** Keeps search input safe for PostgREST filter syntax. */
function sanitizeSearch(q: string | undefined): string | null {
  if (!q) return null;
  const cleaned = q
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);
  return cleaned.length ? cleaned : null;
}

export async function searchProducts(
  params: ProductSearchParams = {},
): Promise<Loaded<ProductCardData[]>> {
  "use cache";
  cacheTag(CACHE_TAGS.products, CACHE_TAGS.categories);

  const supabase = createPublicClient();
  if (!supabase) {
    cacheLife("minutes");
    return FAILED;
  }

  let query = supabase.from("products").select(PRODUCT_CARD_SELECT).eq("is_active", true);

  if (params.category) {
    const { data: category, error } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", params.category)
      .eq("is_active", true)
      .maybeSingle();
    if (error) {
      logFailure("search:category", error);
      cacheLife("minutes");
      return FAILED;
    }
    if (!category) {
      cacheLife("hours");
      return { ok: true, data: [] };
    }
    query = query.eq("category_id", category.id);
  }

  if (params.featured) query = query.eq("is_featured", true);
  if (params.newArrival) query = query.eq("is_new_arrival", true);

  const term = sanitizeSearch(params.q);
  if (term) {
    const pattern = `%${term.replace(/\s+/g, "%")}%`;
    query = query.or(
      `name.ilike.${pattern},short_description.ilike.${pattern},description.ilike.${pattern}`,
    );
  }

  const { data, error } = await query
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    logFailure("search", error);
    cacheLife("minutes");
    return FAILED;
  }

  cacheLife("hours");
  return { ok: true, data: data.map(toProductCard) };
}

export async function getFeaturedProducts(limit = 8): Promise<Loaded<ProductCardData[]>> {
  "use cache";
  cacheTag(CACHE_TAGS.products, CACHE_TAGS.categories);

  const supabase = createPublicClient();
  if (!supabase) {
    cacheLife("minutes");
    return FAILED;
  }

  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_CARD_SELECT)
    .eq("is_active", true)
    .eq("is_featured", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    logFailure("featured", error);
    cacheLife("minutes");
    return FAILED;
  }

  cacheLife("hours");
  return { ok: true, data: data.map(toProductCard) };
}

export async function getNewArrivals(limit = 8): Promise<Loaded<ProductCardData[]>> {
  "use cache";
  cacheTag(CACHE_TAGS.products, CACHE_TAGS.categories);

  const supabase = createPublicClient();
  if (!supabase) {
    cacheLife("minutes");
    return FAILED;
  }

  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_CARD_SELECT)
    .eq("is_active", true)
    .eq("is_new_arrival", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    logFailure("new-arrivals", error);
    cacheLife("minutes");
    return FAILED;
  }

  cacheLife("hours");
  return { ok: true, data: data.map(toProductCard) };
}

export async function getProductBySlug(slug: string): Promise<Loaded<Product | null>> {
  "use cache";
  cacheTag(CACHE_TAGS.products, CACHE_TAGS.categories);

  const supabase = createPublicClient();
  if (!supabase) {
    cacheLife("minutes");
    return FAILED;
  }

  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_FULL_SELECT)
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    logFailure("product", error);
    cacheLife("minutes");
    return FAILED;
  }

  cacheLife("hours");
  return { ok: true, data: data ? toProduct(data) : null };
}

export async function getRelatedProducts(
  categoryId: string,
  excludeProductId: string,
  limit = 4,
): Promise<ProductCardData[]> {
  "use cache";
  cacheTag(CACHE_TAGS.products, CACHE_TAGS.categories);

  const supabase = createPublicClient();
  if (!supabase) {
    cacheLife("minutes");
    return [];
  }

  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_CARD_SELECT)
    .eq("is_active", true)
    .eq("category_id", categoryId)
    .neq("id", excludeProductId)
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    logFailure("related", error);
    cacheLife("minutes");
    return [];
  }

  cacheLife("hours");
  return data.map(toProductCard);
}

/** Slugs + timestamps for the sitemap and static generation. */
export async function getPublicSlugs(): Promise<{
  products: { slug: string; updated_at: string }[];
  categories: { slug: string; updated_at: string }[];
}> {
  "use cache";
  cacheTag(CACHE_TAGS.products, CACHE_TAGS.categories);

  const empty = { products: [], categories: [] };
  const supabase = createPublicClient();
  if (!supabase) {
    cacheLife("minutes");
    return empty;
  }

  const [products, categories] = await Promise.all([
    supabase.from("products").select("slug, updated_at").eq("is_active", true).limit(5000),
    supabase.from("categories").select("slug, updated_at").eq("is_active", true),
  ]);

  if (products.error || categories.error) {
    logFailure("slugs", products.error ?? categories.error);
    cacheLife("minutes");
    return empty;
  }

  cacheLife("hours");
  return {
    products: products.data as { slug: string; updated_at: string }[],
    categories: categories.data as { slug: string; updated_at: string }[],
  };
}
