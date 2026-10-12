import "server-only";
import { revalidateTag } from "next/cache";
import { CACHE_TAGS } from "./cache-tags";

/**
 * Expires public caches immediately after an admin mutation so the next
 * visitor sees fresh data (`expire: 0` = no stale serving).
 */
export function revalidateProducts() {
  revalidateTag(CACHE_TAGS.products, { expire: 0 });
}

/** Category changes also affect which products are publicly visible. */
export function revalidateCategories() {
  revalidateTag(CACHE_TAGS.categories, { expire: 0 });
  revalidateTag(CACHE_TAGS.products, { expire: 0 });
}

export function revalidateSettings() {
  revalidateTag(CACHE_TAGS.settings, { expire: 0 });
}
