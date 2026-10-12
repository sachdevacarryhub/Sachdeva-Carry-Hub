import "server-only";
import QRCode from "qrcode";

export type QrFormat = "png" | "svg";

const QR_OPTIONS = {
  // "Q" tolerates scuffed/partly covered stickers better than the default "M".
  errorCorrectionLevel: "Q" as const,
  margin: 2,
  color: { dark: "#111111", light: "#FFFFFF" },
};

/** Generates a QR code for `url`. Never stored; generated on demand. */
export async function generateQr(url: string, format: QrFormat): Promise<Buffer | string> {
  // Guard against malformed codes: only absolute http(s) URLs are encoded.
  const parsed = new URL(url);
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error("QR codes can only encode http(s) URLs.");
  }

  if (format === "svg") {
    return QRCode.toString(parsed.toString(), { ...QR_OPTIONS, type: "svg", width: 512 });
  }
  return QRCode.toBuffer(parsed.toString(), { ...QR_OPTIONS, type: "png", width: 1024 });
}

export function qrResponse(
  content: Buffer | string,
  format: QrFormat,
  filename: string,
  download: boolean,
): Response {
  const safeName = filename.replace(/[^a-z0-9-]+/gi, "-").slice(0, 80) || "qr";
  const body = typeof content === "string" ? content : new Uint8Array(content);
  return new Response(body, {
    headers: {
      "Content-Type": format === "svg" ? "image/svg+xml; charset=utf-8" : "image/png",
      "Cache-Control": "private, no-store",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${safeName}.${format}"`,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
