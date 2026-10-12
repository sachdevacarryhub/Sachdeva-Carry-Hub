import type { NextRequest } from "next/server";
import { guardAdmin, jsonError } from "@/lib/api/http";
import { absoluteUrl } from "@/lib/env";
import { generateQr, qrResponse } from "@/lib/qr/generate";

/**
 * GET /api/qr/site?format=png|svg&download=1 (admin only)
 * Website QR for visiting cards, the shop counter, banners and packaging.
 */
export async function GET(request: NextRequest) {
  const guard = await guardAdmin(request);
  if (!guard.ok) return guard.response;

  const format = request.nextUrl.searchParams.get("format") === "svg" ? "svg" : "png";
  const download = request.nextUrl.searchParams.get("download") === "1";

  const url = absoluteUrl("/");
  if (!url) {
    return jsonError(
      503,
      "NEXT_PUBLIC_SITE_URL is not configured, so the website QR cannot be generated.",
    );
  }

  try {
    const qr = await generateQr(url, format);
    return qrResponse(qr, format, "qr-website", download);
  } catch (err) {
    console.error("[qr:site]", err instanceof Error ? err.message : err);
    return jsonError(500, "Could not generate the QR code.");
  }
}
