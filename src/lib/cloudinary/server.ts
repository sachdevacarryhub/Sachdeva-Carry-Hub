import "server-only";
import { createHash } from "node:crypto";
import { getCloudinaryConfig } from "@/lib/env.server";
import { CLOUDINARY_ROOT_FOLDER } from "@/lib/validations/common";
import type { UploadedImage } from "@/types";

export const UPLOAD_FOLDERS = ["products", "categories", "branding"] as const;
export type UploadFolder = (typeof UPLOAD_FOLDERS)[number];

export class CloudinaryError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "CloudinaryError";
  }
}

/** Cloudinary API signature: SHA-1 of sorted params + API secret. */
function sign(params: Record<string, string>, apiSecret: string): string {
  const toSign = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return createHash("sha1").update(`${toSign}${apiSecret}`).digest("hex");
}

/**
 * Builds the destination folder.
 * products/<category-slug>, categories, branding — all under the root folder.
 */
export function buildFolder(folder: UploadFolder, subfolder?: string | null): string {
  const safeSub = subfolder
    ?.toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const parts = [CLOUDINARY_ROOT_FOLDER, folder];
  if (folder === "products") parts.push(safeSub || "uncategorized");
  return parts.join("/");
}

interface CloudinaryUploadResponse {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  format: string;
  error?: { message: string };
}

/** Uploads an (already optimised) image, stored as WebP. */
export async function uploadImage(file: Blob, folder: string): Promise<UploadedImage> {
  const config = getCloudinaryConfig();
  if (!config) throw new CloudinaryError("Cloudinary is not configured.", 503);

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const params: Record<string, string> = {
    folder,
    format: "webp",
    timestamp,
    unique_filename: "true",
    overwrite: "false",
  };

  const body = new FormData();
  body.append("file", file);
  for (const [key, value] of Object.entries(params)) body.append(key, value);
  body.append("api_key", config.apiKey);
  body.append("signature", sign(params, config.apiSecret));

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(config.cloudName)}/image/upload`,
    { method: "POST", body, cache: "no-store" },
  );
  const json = (await response.json().catch(() => null)) as CloudinaryUploadResponse | null;

  if (!response.ok || !json || json.error) {
    console.error("[cloudinary:upload]", response.status, json?.error?.message);
    throw new CloudinaryError("Image upload to Cloudinary failed.", 502);
  }

  return {
    cloudinary_public_id: json.public_id,
    image_url: json.secure_url,
    width: json.width,
    height: json.height,
    format: json.format,
  };
}

/**
 * Deletes an asset. Never throws: failures are logged server-side and
 * reported as `false` so callers can continue safely.
 */
export async function destroyImage(publicId: string): Promise<boolean> {
  const config = getCloudinaryConfig();
  if (!config) {
    console.error("[cloudinary:destroy] Cloudinary is not configured; skipped", publicId);
    return false;
  }

  const params: Record<string, string> = {
    invalidate: "true",
    public_id: publicId,
    timestamp: Math.floor(Date.now() / 1000).toString(),
  };

  const body = new URLSearchParams({
    ...params,
    api_key: config.apiKey,
    signature: sign(params, config.apiSecret),
  });

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${encodeURIComponent(config.cloudName)}/image/destroy`,
      { method: "POST", body, cache: "no-store" },
    );
    const json = (await response.json().catch(() => null)) as { result?: string } | null;
    // "not found" means it is already gone, which is the desired end state.
    if (response.ok && (json?.result === "ok" || json?.result === "not found")) return true;
    console.error("[cloudinary:destroy]", response.status, json?.result, publicId);
    return false;
  } catch (error) {
    console.error("[cloudinary:destroy]", error instanceof Error ? error.message : error, publicId);
    return false;
  }
}

export async function destroyImages(publicIds: readonly string[]): Promise<void> {
  await Promise.all(publicIds.filter(Boolean).map((id) => destroyImage(id)));
}
