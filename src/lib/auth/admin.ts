import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createServerSupabase } from "@/lib/supabase/server";

export type AdminCheck =
  | { status: "unconfigured" }
  | { status: "unauthenticated" }
  | { status: "forbidden"; email: string | null }
  | { status: "admin"; userId: string; email: string | null; supabase: SupabaseClient };

/**
 * Resolves the current request's admin status.
 *
 * 1. Verifies the session JWT (getClaims validates the signature).
 * 2. Confirms the user is listed in public.admin_users.
 *
 * Being signed in alone never grants admin access.
 * Memoized per request with React `cache`.
 */
export const getAdminStatus = cache(async (): Promise<AdminCheck> => {
  // Always evaluate per request, never at build time (even when unconfigured).
  await connection();
  const supabase = await createServerSupabase();
  if (!supabase) return { status: "unconfigured" };

  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (error || !claims || typeof claims.sub !== "string") return { status: "unauthenticated" };

  const email = typeof claims.email === "string" ? claims.email : null;

  const { data: adminRow, error: adminError } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", claims.sub)
    .maybeSingle();

  if (adminError || !adminRow) return { status: "forbidden", email };

  return { status: "admin", userId: claims.sub, email, supabase };
});

/**
 * For admin pages: returns the admin context or redirects to the login page.
 */
export async function requireAdmin(nextPath = "/admin") {
  const result = await getAdminStatus();
  if (result.status === "admin") return result;

  const params = new URLSearchParams({ next: nextPath });
  if (result.status === "forbidden") params.set("error", "forbidden");
  if (result.status === "unconfigured") params.set("error", "unconfigured");
  redirect(`/admin/login?${params.toString()}`);
}
