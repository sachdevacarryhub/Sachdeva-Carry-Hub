import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured, publicEnv } from "@/lib/env";

/**
 * Cookie-less Supabase client using the public anon key.
 *
 * Used for public, cacheable reads (`"use cache"` scopes cannot read cookies).
 * Row Level Security limits it to active, public data.
 * Returns null when Supabase is not configured so pages can degrade gracefully.
 */
export function createPublicClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  return createClient(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
