import type { NextRequest } from "next/server";
import { guardAdmin, isUuid, jsonError } from "@/lib/api/http";
import { absoluteUrl, publicEnv } from "@/lib/env";
import { generateQr, qrResponse } from "@/lib/qr/generate";

/**
 * GET /api/qr/product/[id]?format=png|svg&download=1 (admin only)
 * Encodes NEXT_PUBLIC_SITE_URL/product/<slug>. Generated on demand, never stored.
 */
export async function GET(request: NextRequest, { params }: RouteContext<"/api/qr/product/[id]">) {
  const guard = await guardAdmin(request);
  if (!guard.ok) return guard.response;

  const { id } = await params;
  if (!isUuid(id)) return jsonError(400, "Invalid product id.");

  const format = request.nextUrl.searchParams.get("format") === "svg" ? "svg" : "png";
  const download = request.nextUrl.searchParams.get("download") === "1";

  if (!publicEnv.siteUrl) {
    return jsonError(
      503,
      "NEXT_PUBLIC_SITE_URL is not configured, so a valid product URL cannot be encoded.",
    );
  }

  const { data, error } = await guard.admin.supabase
    .from("products")
    .select("slug")
    .eq("id", id)
    .maybeSingle();
  if (error) return jsonError(500, "Could not load the product.");
  if (!data) return jsonError(404, "Product not found.");

  const slug = String(data.slug);
  const url = absoluteUrl(`/product/${slug}`);
  if (!url) return jsonError(503, "Site URL is not configured.");

  try {
    const qr = await generateQr(url, format);
    return qrResponse(qr, format, `qr-${slug}`, download);
  } catch (err) {
    console.error("[qr:product]", err instanceof Error ? err.message : err);
    return jsonError(500, "Could not generate the QR code.");
  }
}
