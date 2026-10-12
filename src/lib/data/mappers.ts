import type {
  Category,
  CategorySummary,
  Product,
  ProductCardData,
  ProductColor,
  ProductFeature,
  ProductImage,
  ProductSpecifications,
  StoreSettings,
} from "@/types";

/** Columns needed for product cards. */
export const PRODUCT_CARD_SELECT =
  "id, name, slug, short_description, is_featured, is_new_arrival, sort_order, created_at, category:categories(id, name, slug), images:product_images(image_url, alt_text, width, height, is_primary, sort_order)";

/** Columns needed for a full product. */
export const PRODUCT_FULL_SELECT =
  "*, category:categories(id, name, slug), images:product_images(*)";

export const CATEGORY_SELECT =
  "id, name, slug, description, image_url, image_public_id, is_active, sort_order, created_at, updated_at";

type Row = Record<string, unknown>;

const str = (value: unknown): string | null =>
  typeof value === "string" && value.length > 0 ? value : null;
const num = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

function toCategorySummary(value: unknown): CategorySummary | null {
  // PostgREST returns an object for many-to-one embeds, but be defensive.
  const row = (Array.isArray(value) ? value[0] : value) as Row | null | undefined;
  if (!row || typeof row !== "object") return null;
  const id = str(row.id);
  const name = str(row.name);
  const slug = str(row.slug);
  return id && name && slug ? { id, name, slug } : null;
}

function toFeatures(value: unknown): ProductFeature[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const row = item as Row;
    const label = str(row?.label);
    const val = str(row?.value);
    return label && val ? [{ label, value: val }] : [];
  });
}

function toSpecifications(value: unknown): ProductSpecifications {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const result: ProductSpecifications = {};
  for (const [key, val] of Object.entries(value as Row)) {
    if (typeof val === "string" && val.trim()) result[key] = val;
    else if (typeof val === "number" || typeof val === "boolean") result[key] = String(val);
  }
  return result;
}

function toColors(value: unknown): ProductColor[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (typeof item === "string" && item.trim()) return [{ name: item.trim(), hex: null }];
    const row = item as Row;
    const name = str(row?.name);
    if (!name) return [];
    const hex = str(row?.hex);
    return [{ name, hex: hex && /^#[0-9a-fA-F]{6}$/.test(hex) ? hex : null }];
  });
}

function toImage(row: Row): ProductImage {
  return {
    id: String(row.id),
    product_id: String(row.product_id),
    cloudinary_public_id: String(row.cloudinary_public_id),
    image_url: String(row.image_url),
    alt_text: str(row.alt_text),
    width: num(row.width),
    height: num(row.height),
    format: str(row.format),
    sort_order: num(row.sort_order) ?? 0,
    is_primary: row.is_primary === true,
  };
}

/** Primary image first, then by sort order. */
export function sortImages<T extends { is_primary: boolean; sort_order: number }>(
  images: T[],
): T[] {
  return [...images].sort((a, b) => {
    if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1;
    return a.sort_order - b.sort_order;
  });
}

export function toProduct(row: Row): Product {
  const images = Array.isArray(row.images) ? (row.images as Row[]).map(toImage) : [];
  return {
    id: String(row.id),
    name: String(row.name),
    slug: String(row.slug),
    category_id: str(row.category_id),
    short_description: str(row.short_description),
    description: str(row.description),
    features: toFeatures(row.features),
    specifications: toSpecifications(row.specifications),
    available_colors: toColors(row.available_colors),
    is_featured: row.is_featured === true,
    is_new_arrival: row.is_new_arrival === true,
    is_active: row.is_active === true,
    sort_order: num(row.sort_order) ?? 0,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    category: toCategorySummary(row.category),
    // Gallery order is the admin-defined sort order.
    images: images.sort((a, b) => a.sort_order - b.sort_order),
  };
}

export function toProductCard(row: Row): ProductCardData {
  const images = Array.isArray(row.images)
    ? (row.images as Row[]).map((image) => ({
        image_url: String(image.image_url),
        alt_text: str(image.alt_text),
        width: num(image.width),
        height: num(image.height),
        is_primary: image.is_primary === true,
        sort_order: num(image.sort_order) ?? 0,
      }))
    : [];
  const primary = sortImages(images)[0];

  return {
    id: String(row.id),
    name: String(row.name),
    slug: String(row.slug),
    short_description: str(row.short_description),
    is_featured: row.is_featured === true,
    is_new_arrival: row.is_new_arrival === true,
    category: toCategorySummary(row.category),
    image: primary
      ? {
          image_url: primary.image_url,
          alt_text: primary.alt_text,
          width: primary.width,
          height: primary.height,
        }
      : null,
  };
}

export function toCategory(row: Row): Category {
  return {
    id: String(row.id),
    name: String(row.name),
    slug: String(row.slug),
    description: str(row.description),
    image_url: str(row.image_url),
    image_public_id: str(row.image_public_id),
    is_active: row.is_active === true,
    sort_order: num(row.sort_order) ?? 0,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

/** Used only when the settings row cannot be loaded. Holds no contact data. */
export const EMPTY_STORE_SETTINGS: StoreSettings = {
  id: null,
  store_name: "Sachdeva Carry Hub",
  owner_name: null,
  phone_primary: null,
  phone_secondary: null,
  whatsapp_number: null,
  address: null,
  city: null,
  state: null,
  pincode: null,
  instagram_url: null,
  google_maps_url: null,
  logo_url: null,
  favicon_url: null,
  established_on: null,
  updated_at: null,
};

export function toStoreSettings(row: Row | null): StoreSettings {
  if (!row) return EMPTY_STORE_SETTINGS;
  return {
    id: str(row.id),
    store_name: str(row.store_name) ?? EMPTY_STORE_SETTINGS.store_name,
    owner_name: str(row.owner_name),
    phone_primary: str(row.phone_primary),
    phone_secondary: str(row.phone_secondary),
    whatsapp_number: str(row.whatsapp_number),
    address: str(row.address),
    city: str(row.city),
    state: str(row.state),
    pincode: str(row.pincode),
    instagram_url: str(row.instagram_url),
    google_maps_url: str(row.google_maps_url),
    logo_url: str(row.logo_url),
    favicon_url: str(row.favicon_url),
    established_on: str(row.established_on),
    updated_at: str(row.updated_at),
  };
}
