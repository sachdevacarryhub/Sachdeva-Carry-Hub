export interface ProductFeature {
  label: string;
  value: string;
}

export interface ProductColor {
  name: string;
  /** Optional swatch colour, e.g. "#111111" */
  hex?: string | null;
}

export type ProductSpecifications = Record<string, string>;

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  image_public_id: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export type CategorySummary = Pick<Category, "id" | "name" | "slug">;

export interface ProductImage {
  id: string;
  product_id: string;
  cloudinary_public_id: string;
  image_url: string;
  alt_text: string | null;
  width: number | null;
  height: number | null;
  format: string | null;
  sort_order: number;
  is_primary: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  category_id: string | null;
  short_description: string | null;
  description: string | null;
  features: ProductFeature[];
  specifications: ProductSpecifications;
  available_colors: ProductColor[];
  is_featured: boolean;
  is_new_arrival: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  category: CategorySummary | null;
  images: ProductImage[];
}

/** Lightweight shape used by product cards and listings. */
export interface ProductCardData {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  is_featured: boolean;
  is_new_arrival: boolean;
  category: CategorySummary | null;
  image: Pick<ProductImage, "image_url" | "alt_text" | "width" | "height"> | null;
}

export interface StoreSettings {
  id: string | null;
  store_name: string;
  owner_name: string | null;
  phone_primary: string | null;
  phone_secondary: string | null;
  whatsapp_number: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  instagram_url: string | null;
  google_maps_url: string | null;
  logo_url: string | null;
  favicon_url: string | null;
  established_on: string | null;
  updated_at: string | null;
}

export interface UploadedImage {
  cloudinary_public_id: string;
  image_url: string;
  width: number;
  height: number;
  format: string;
}

export interface ProductSearchParams {
  q?: string;
  category?: string;
  featured?: boolean;
  newArrival?: boolean;
}
