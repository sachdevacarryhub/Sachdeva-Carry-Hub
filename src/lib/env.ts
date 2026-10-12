/**
 * Public environment helpers. Safe to import from client and server code.
 *
 * NEXT_PUBLIC_* variables must be referenced literally so Next.js can inline
 * them into the browser bundle.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";
const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() ?? "";

function parseSiteUrl(value: string): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    // Origin + optional base path, never a trailing slash.
    return `${url.origin}${url.pathname}`.replace(/\/+$/, "");
  } catch {
    return null;
  }
}

const siteUrl = parseSiteUrl(rawSiteUrl);

export const publicEnv = {
  supabaseUrl,
  supabaseAnonKey,
  /** Validated site URL without trailing slash, or null when missing/invalid. */
  siteUrl,
  /** True when NEXT_PUBLIC_SITE_URL is set but is not a valid http(s) URL. */
  siteUrlInvalid: rawSiteUrl.length > 0 && siteUrl === null,
} as const;

export function isSupabaseConfigured(): boolean {
  return publicEnv.supabaseUrl.length > 0 && publicEnv.supabaseAnonKey.length > 0;
}

/** Base URL used for metadata; falls back to localhost for development. */
export function getMetadataBase(): URL {
  return new URL(publicEnv.siteUrl ?? "http://localhost:3000");
}

/** Absolute URL for a path, or null when NEXT_PUBLIC_SITE_URL is not configured. */
export function absoluteUrl(path = "/"): string | null {
  if (!publicEnv.siteUrl) return null;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${publicEnv.siteUrl}${normalized === "/" ? "/" : normalized}`;
}
