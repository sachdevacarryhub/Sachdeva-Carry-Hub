"use client";

/**
 * Client-side image optimisation before upload:
 * validate type -> validate size -> resize -> compress -> WebP.
 * Original, uncompressed files are never uploaded.
 */

export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const MAX_INPUT_BYTES = 20 * 1024 * 1024; // 20 MB straight from a phone camera is fine
const MAX_WIDTH = 1800;
const MAX_HEIGHT = 2400;
const TARGET_BYTES = 300 * 1024;
const QUALITY_STEPS = [0.85, 0.8, 0.75, 0.7];

export class ImageValidationError extends Error {}

export interface OptimizedImage {
  blob: Blob;
  width: number;
  height: number;
  /** "image/webp", or "image/jpeg" on browsers that cannot encode WebP (Cloudinary converts it). */
  type: string;
}

export function validateImageFile(file: File): void {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type as (typeof ACCEPTED_IMAGE_TYPES)[number])) {
    throw new ImageValidationError(`“${file.name}” is not supported. Use JPEG, PNG or WebP.`);
  }
  if (file.size > MAX_INPUT_BYTES) {
    throw new ImageValidationError(`“${file.name}” is larger than 20 MB.`);
  }
  if (file.size === 0) throw new ImageValidationError(`“${file.name}” is empty.`);
}

function fitWithin(width: number, height: number, maxW: number, maxH: number) {
  const scale = Math.min(1, maxW / width, maxH / height);
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

async function loadBitmap(file: File): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new ImageValidationError(`“${file.name}” could not be read as an image.`);
  }
}

export async function optimizeImage(file: File): Promise<OptimizedImage> {
  validateImageFile(file);
  const bitmap = await loadBitmap(file);

  try {
    let { width, height } = fitWithin(bitmap.width, bitmap.height, MAX_WIDTH, MAX_HEIGHT);
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) throw new ImageValidationError("Your browser could not process this image.");

    const draw = () => {
      canvas.width = width;
      canvas.height = height;
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      // White matte so transparent PNGs never turn black in JPEG fallback.
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, width, height);
      context.drawImage(bitmap, 0, 0, width, height);
    };
    draw();

    let best: Blob | null = null;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      for (const quality of QUALITY_STEPS) {
        const blob = await canvasToBlob(canvas, "image/webp", quality);
        if (!blob) continue;
        best = blob;
        if (blob.size <= TARGET_BYTES) break;
      }
      if (best && best.size <= TARGET_BYTES * 1.4) break;
      // Still heavy (very detailed photo): scale down once and retry.
      ({ width, height } = fitWithin(width, height, 1400, 1866));
      draw();
    }

    // Browsers without WebP encoding return PNG; fall back to a compact JPEG.
    if (!best || best.type !== "image/webp") {
      const jpeg = await canvasToBlob(canvas, "image/jpeg", 0.82);
      if (!jpeg) throw new ImageValidationError("Your browser could not compress this image.");
      return { blob: jpeg, width, height, type: "image/jpeg" };
    }

    return { blob: best, width, height, type: "image/webp" };
  } finally {
    bitmap.close();
  }
}
