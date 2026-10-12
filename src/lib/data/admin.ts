import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Category, Product, StoreSettings } from "@/types";
import {
  CATEGORY_SELECT,
  PRODUCT_FULL_SELECT,
  toCategory,
  toProduct,
  toStoreSettings,
} from "./mappers";

/**
 * Admin data access. Always called with the signed-in admin's Supabase client
 * (never cached, RLS-enforced). Errors are thrown and shown by the admin
 * error boundary without exposing raw database messages.
 */

export class AdminDataError extends Error {
  constructor(scope: string, cause: { message?: string; code?: string }) {
    super(`Failed to load ${scope}.`);
    this.name = "AdminDataError";
    console.error(`[admin-data:${scope}]`, cause.code ?? "", cause.message ?? "");
  }
}

export interface DashboardStats {
  totalProducts: number;
  activeProducts: number;
  totalCategories: number;
  featuredProducts: number;
  newArrivals: number;
}

export async function getDashboardStats(supabase: SupabaseClient): Promise<DashboardStats> {
  const count = (table: string) =>
    supabase.from(table).select("id", { count: "exact", head: true });

  const [total, active, categories, featured, arrivals] = await Promise.all([
    count("products"),
    count("products").eq("is_active", true),
    count("categories"),
    count("products").eq("is_featured", true),
    count("products").eq("is_new_arrival", true),
  ]);

  const failed = [total, active, categories, featured, arrivals].find((r) => r.error);
  if (failed?.error) throw new AdminDataError("dashboard", failed.error);

  return {
    totalProducts: total.count ?? 0,
    activeProducts: active.count ?? 0,
    totalCategories: categories.count ?? 0,
    featuredProducts: featured.count ?? 0,
    newArrivals: arrivals.count ?? 0,
  };
}

export async function listAdminProducts(
  supabase: SupabaseClient,
  options: { limit?: number } = {},
): Promise<Product[]> {
  let query = supabase
    .from("products")
    .select(PRODUCT_FULL_SELECT)
    .order("created_at", { ascending: false });
  if (options.limit) query = query.limit(options.limit);

  const { data, error } = await query;
  if (error) throw new AdminDataError("products", error);
  return data.map(toProduct);
}

export async function getAdminProduct(
  supabase: SupabaseClient,
  id: string,
): Promise<Product | null> {
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_FULL_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new AdminDataError("product", error);
  return data ? toProduct(data) : null;
}

export interface AdminCategory extends Category {
  product_count: number;
}

export async function listAdminCategories(supabase: SupabaseClient): Promise<AdminCategory[]> {
  const { data, error } = await supabase
    .from("categories")
    .select(`${CATEGORY_SELECT}, products(count)`)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw new AdminDataError("categories", error);

  return data.map((row) => {
    const counts = (row as { products?: { count: number }[] }).products;
    return { ...toCategory(row), product_count: counts?.[0]?.count ?? 0 };
  });
}

export async function getAdminCategory(
  supabase: SupabaseClient,
  id: string,
): Promise<Category | null> {
  const { data, error } = await supabase
    .from("categories")
    .select(CATEGORY_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new AdminDataError("category", error);
  return data ? toCategory(data) : null;
}

export async function getAdminSettings(supabase: SupabaseClient): Promise<StoreSettings> {
  const { data, error } = await supabase.from("store_settings").select("*").limit(1).maybeSingle();
  if (error) throw new AdminDataError("settings", error);
  return toStoreSettings(data);
}
