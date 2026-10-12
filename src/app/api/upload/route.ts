import type { NextRequest } from "next/server";
import { z } from "zod";
import { databaseError, guardAdmin, jsonError, jsonOk, parseJsonBody } from "@/lib/api/http";
import {
  buildFolder,
  CloudinaryError,
  destroyImage,
  UPLOAD_FOLDERS,
  uploadImage,
} from "@/lib/cloudinary/server";
import { isCloudinaryConfigured } from "@/lib/env.server";
import { cloudinaryPublicIdSchema } from "@/lib/validations/common";

/** Images are compressed in the browser first; this is a hard safety cap. */
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/webp", "image/jpeg", "image/png"]);

/** Checks the file signature so a renamed non-image is rejected. */
function hasImageSignature(bytes: Uint8Array): boolean {
  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  const isWebp =
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  return isJpeg || isPng || isWebp;
}

const uploadFieldsSchema = z.object({
  folder: z.enum(UPLOAD_FOLDERS),
  subfolder: z
    .string()
    .trim()
    .max(140)
    .regex(/^[a-z0-9-]*$/)
    .optional(),
});

/** POST /api/upload — multipart: file, folder, subfolder? (admin only) */
export async function POST(request: NextRequest) {
  const guard = await guardAdmin(request);
  if (!guard.ok) return guard.response;

  if (!isCloudinaryConfigured()) {
    return jsonError(
      503,
      "Cloudinary is not configured. Add the Cloudinary environment variables.",
    );
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_UPLOAD_BYTES + 64 * 1024) {
    return jsonError(413, "Image is too large. Maximum upload size is 4 MB.");
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonError(400, "Expected multipart form data.");
  }

  const fields = uploadFieldsSchema.safeParse({
    folder: form.get("folder"),
    subfolder: form.get("subfolder") ?? undefined,
  });
  if (!fields.success) return jsonError(422, "Invalid upload destination.");

  const file = form.get("file");
  if (!(file instanceof File)) return jsonError(422, "No image was provided.");
  if (!ALLOWED_TYPES.has(file.type)) {
    return jsonError(415, "Unsupported image type. Use JPEG, PNG or WebP.");
  }
  if (file.size === 0) return jsonError(422, "The image file is empty.");
  if (file.size > MAX_UPLOAD_BYTES) {
    return jsonError(413, "Image is too large. Maximum upload size is 4 MB.");
  }

  const header = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (!hasImageSignature(header)) {
    return jsonError(415, "The file does not look like a valid image.");
  }

  try {
    const uploaded = await uploadImage(
      file,
      buildFolder(fields.data.folder, fields.data.subfolder),
    );
    return jsonOk(uploaded, 201);
  } catch (error) {
    if (error instanceof CloudinaryError) return jsonError(error.status, error.message);
    console.error("[upload]", error instanceof Error ? error.message : error);
    return jsonError(502, "Image upload failed. Please try again.");
  }
}

const deleteSchema = z.object({ public_id: cloudinaryPublicIdSchema }).strict();

/**
 * DELETE /api/upload — removes an uploaded asset that has NOT been saved to a
 * product/category yet (e.g. removed before saving or form cancelled).
 * Saved images are removed through the product/category endpoints instead.
 */
export async function DELETE(request: NextRequest) {
  const guard = await guardAdmin(request);
  if (!guard.ok) return guard.response;
  const { supabase } = guard.admin;

  const body = await parseJsonBody(request, deleteSchema);
  if (!body.ok) return body.response;
  const publicId = body.data.public_id;

  const [productRefs, categoryRefs, settings] = await Promise.all([
    supabase
      .from("product_images")
      .select("id", { count: "exact", head: true })
      .eq("cloudinary_public_id", publicId),
    supabase
      .from("categories")
      .select("id", { count: "exact", head: true })
      .eq("image_public_id", publicId),
    supabase.from("store_settings").select("logo_url, favicon_url").limit(1).maybeSingle(),
  ]);
  if (productRefs.error) return databaseError(productRefs.error, "upload-delete-check");
  if (categoryRefs.error) return databaseError(categoryRefs.error, "upload-delete-check");
  if (settings.error) return databaseError(settings.error, "upload-delete-check");

  const usedBySettings = [settings.data?.logo_url, settings.data?.favicon_url].some(
    (url) => typeof url === "string" && url.includes(`/${publicId}.`),
  );

  if ((productRefs.count ?? 0) > 0 || (categoryRefs.count ?? 0) > 0 || usedBySettings) {
    return jsonError(409, "This image is in use. Remove it from the product or category and save.");
  }

  const deleted = await destroyImage(publicId);
  if (!deleted) return jsonError(502, "Could not delete the image from Cloudinary.");
  return jsonOk({ public_id: publicId });
}
