import "server-only";
import { NextResponse } from "next/server";
import type { z } from "zod";
import { getAdminStatus } from "@/lib/auth/admin";

export interface ApiErrorBody {
  error: string;
  fieldErrors?: Record<string, string[]>;
}

export function jsonError(
  status: number,
  error: string,
  fieldErrors?: Record<string, string[]>,
): NextResponse<ApiErrorBody> {
  return NextResponse.json(fieldErrors ? { error, fieldErrors } : { error }, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export function jsonOk<T>(data: T, status = 200): NextResponse<T> {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

/**
 * Rejects cross-site mutation requests (defence in depth on top of SameSite
 * cookies). Browsers always send Origin on POST/PATCH/DELETE fetches.
 */
function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

type AdminGuard =
  | { ok: true; admin: Extract<Awaited<ReturnType<typeof getAdminStatus>>, { status: "admin" }> }
  | { ok: false; response: NextResponse<ApiErrorBody> };

/** Server-side authorization for admin API routes. */
export async function guardAdmin(request: Request): Promise<AdminGuard> {
  const method = request.method.toUpperCase();
  if (method !== "GET" && method !== "HEAD" && !isSameOrigin(request)) {
    return { ok: false, response: jsonError(403, "Cross-origin request rejected.") };
  }

  const status = await getAdminStatus();
  switch (status.status) {
    case "admin":
      return { ok: true, admin: status };
    case "unconfigured":
      return {
        ok: false,
        response: jsonError(503, "Supabase is not configured. Add the environment variables."),
      };
    case "unauthenticated":
      return { ok: false, response: jsonError(401, "Please sign in to continue.") };
    case "forbidden":
      return { ok: false, response: jsonError(403, "This account is not an administrator.") };
  }
}

/** Parses and validates a JSON request body. */
export async function parseJsonBody<T extends z.ZodType>(
  request: Request,
  schema: T,
): Promise<{ ok: true; data: z.output<T> } | { ok: false; response: NextResponse<ApiErrorBody> }> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return { ok: false, response: jsonError(400, "Request body must be valid JSON.") };
  }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.length ? issue.path.join(".") : "_";
      (fieldErrors[key] ??= []).push(issue.message);
    }
    return {
      ok: false,
      response: jsonError(422, "Please fix the highlighted fields.", fieldErrors),
    };
  }
  return { ok: true, data: parsed.data };
}

interface PostgrestLikeError {
  code?: string;
  message?: string;
  details?: string | null;
}

/**
 * Maps database errors to safe, user-facing responses. Raw database messages
 * are logged server-side and never returned to the client.
 */
export function databaseError(
  error: PostgrestLikeError,
  context: string,
): NextResponse<ApiErrorBody> {
  switch (error.code) {
    case "23505":
      return jsonError(
        409,
        `${error.message ?? ""} ${error.details ?? ""}`.includes("slug")
          ? "That URL slug is already in use. Please choose another."
          : "This item already exists. Refresh the page and try again.",
      );
    case "23503":
      return jsonError(
        409,
        context === "category-delete"
          ? "This category still has products. Move or delete them first, or deactivate the category."
          : "A related record does not exist (for example, the selected category).",
      );
    case "23514":
    case "22P02":
    case "22023":
      return jsonError(422, "Some values are invalid. Please review the form.");
    case "42501":
      return jsonError(403, "You are not allowed to perform this action.");
    case "P0002":
    case "PGRST116":
      return jsonError(404, "The requested item was not found.");
    default:
      console.error(`[db:${context}]`, error.code, error.message);
      return jsonError(500, "Something went wrong while saving. Please try again.");
  }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}
