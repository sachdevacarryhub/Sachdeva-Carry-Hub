"use client";

import type { UploadedImage } from "@/types";

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; error: string; fieldErrors?: Record<string, string[]> };

/** JSON fetch wrapper for the admin API with consistent error handling. */
export async function apiRequest<T>(
  url: string,
  init: { method: "GET" | "POST" | "PATCH" | "DELETE"; body?: unknown },
): Promise<ApiResult<T>> {
  try {
    const response = await fetch(url, {
      method: init.method,
      headers: init.body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
      credentials: "same-origin",
      cache: "no-store",
    });
    const json = (await response.json().catch(() => null)) as
      (T & { error?: string; fieldErrors?: Record<string, string[]> }) | null;

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        error:
          json?.error ??
          (response.status === 401
            ? "Your session has expired. Please sign in again."
            : "Something went wrong. Please try again."),
        fieldErrors: json?.fieldErrors,
      };
    }
    return { ok: true, data: json as T };
  } catch {
    return { ok: false, status: 0, error: "Network error. Check your connection and try again." };
  }
}

/** Uploads an optimised image with progress reporting (fetch has no upload progress). */
export function uploadImageWithProgress(
  blob: Blob,
  fields: { folder: "products" | "categories" | "branding"; subfolder?: string },
  onProgress: (fraction: number) => void,
): Promise<ApiResult<UploadedImage>> {
  return new Promise((resolve) => {
    const form = new FormData();
    const extension = blob.type === "image/webp" ? "webp" : "jpg";
    form.append("file", blob, `upload.${extension}`);
    form.append("folder", fields.folder);
    if (fields.subfolder) form.append("subfolder", fields.subfolder);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload");
    xhr.responseType = "json";
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(event.loaded / event.total);
    };
    xhr.onload = () => {
      const json = xhr.response as (UploadedImage & { error?: string }) | null;
      if (xhr.status >= 200 && xhr.status < 300 && json) {
        resolve({ ok: true, data: json });
      } else {
        resolve({
          ok: false,
          status: xhr.status,
          error: json?.error ?? "Upload failed. Please try again.",
        });
      }
    };
    xhr.onerror = () =>
      resolve({ ok: false, status: 0, error: "Network error during upload. Please try again." });
    xhr.send(form);
  });
}

/** Best-effort removal of an uploaded-but-unsaved image. */
export function discardUpload(publicId: string): void {
  void apiRequest("/api/upload", { method: "DELETE", body: { public_id: publicId } });
}
