/**
 * Cache tags for public data. Admin mutations expire these tags so the public
 * website reflects changes on the next request, without a redeploy.
 */
export const CACHE_TAGS = {
  products: "products",
  categories: "categories",
  settings: "store-settings",
} as const;
