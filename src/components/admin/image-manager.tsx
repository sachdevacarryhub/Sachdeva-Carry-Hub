"use client";

import {
  ArrowLeft,
  ArrowRight,
  CircleAlert,
  GripVertical,
  ImagePlus,
  LoaderCircle,
  Star,
  Trash,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState, type DragEvent } from "react";
import { toast } from "sonner";
import { discardUpload, uploadImageWithProgress } from "@/lib/api/client";
import { ACCEPTED_IMAGE_TYPES, ImageValidationError, optimizeImage } from "@/lib/images/optimize";
import { cn } from "@/lib/utils/cn";

export interface GalleryItem {
  key: string;
  /** Saved image id (absent for images uploaded in this session). */
  id?: string;
  cloudinary_public_id?: string;
  image_url?: string;
  width?: number | null;
  height?: number | null;
  format?: string | null;
  alt_text: string;
  is_primary: boolean;
  status: "optimizing" | "uploading" | "ready" | "error";
  progress: number;
  previewUrl?: string;
  error?: string;
}

/** The primary image is the flagged one, otherwise the first ready image. */
export function resolvePrimaryKey(items: GalleryItem[]): string | null {
  const ready = items.filter((item) => item.status === "ready");
  return (ready.find((item) => item.is_primary) ?? ready[0])?.key ?? null;
}

interface ImageManagerProps {
  items: GalleryItem[];
  onChange: (updater: (items: GalleryItem[]) => GalleryItem[]) => void;
  /** Category slug, used for the Cloudinary sub-folder. */
  subfolder?: string;
  max: number;
}

let uploadCounter = 0;

export function ImageManager({ items, onChange, subfolder, max }: ImageManagerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragKey, setDragKey] = useState<string | null>(null);
  const [dropActive, setDropActive] = useState(false);
  const previewUrls = useRef(new Set<string>());

  useEffect(() => {
    const urls = previewUrls.current;
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  const primaryKey = resolvePrimaryKey(items);
  const patch = (key: string, value: Partial<GalleryItem>) =>
    onChange((prev) => prev.map((item) => (item.key === key ? { ...item, ...value } : item)));

  async function processFile(file: File, key: string) {
    try {
      const optimized = await optimizeImage(file);
      patch(key, { status: "uploading", progress: 0 });
      const result = await uploadImageWithProgress(
        optimized.blob,
        { folder: "products", subfolder },
        (fraction) => patch(key, { progress: fraction }),
      );
      if (!result.ok) {
        patch(key, { status: "error", error: result.error });
        return;
      }
      patch(key, {
        status: "ready",
        progress: 1,
        cloudinary_public_id: result.data.cloudinary_public_id,
        image_url: result.data.image_url,
        width: result.data.width,
        height: result.data.height,
        format: result.data.format,
      });
    } catch (error) {
      patch(key, {
        status: "error",
        error:
          error instanceof ImageValidationError
            ? error.message
            : "This image could not be processed.",
      });
    }
  }

  function addFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList);
    const room = max - items.length;
    if (room <= 0) {
      toast.error(`A product can have up to ${max} images.`);
      return;
    }
    if (files.length > room)
      toast.warning(`Only the first ${room} image(s) were added (limit ${max}).`);

    const accepted: { file: File; key: string }[] = [];
    for (const file of files.slice(0, room)) {
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type as (typeof ACCEPTED_IMAGE_TYPES)[number])) {
        toast.error(`“${file.name}” is not a JPEG, PNG or WebP image.`);
        continue;
      }
      accepted.push({ file, key: `upload-${(uploadCounter += 1)}` });
    }
    if (accepted.length === 0) return;

    const newItems: GalleryItem[] = accepted.map(({ file, key }) => {
      const previewUrl = URL.createObjectURL(file);
      previewUrls.current.add(previewUrl);
      return {
        key,
        alt_text: "",
        is_primary: false,
        status: "optimizing",
        progress: 0,
        previewUrl,
      };
    });
    onChange((prev) => [...prev, ...newItems]);

    // Two at a time keeps the UI responsive on phones.
    const queue = [...accepted];
    const worker = async () => {
      for (let next = queue.shift(); next; next = queue.shift()) {
        await processFile(next.file, next.key);
      }
    };
    void Promise.all([worker(), worker()]);
  }

  function remove(item: GalleryItem) {
    // Unsaved uploads are deleted right away; saved images are removed on save.
    if (!item.id && item.cloudinary_public_id) discardUpload(item.cloudinary_public_id);
    onChange((prev) => prev.filter((i) => i.key !== item.key));
  }

  function setPrimary(key: string) {
    onChange((prev) => prev.map((item) => ({ ...item, is_primary: item.key === key })));
  }

  function move(key: string, delta: number) {
    onChange((prev) => {
      const index = prev.findIndex((item) => item.key === key);
      const target = index + delta;
      if (index < 0 || target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      const [item] = next.splice(index, 1);
      if (item) next.splice(target, 0, item);
      return next;
    });
  }

  function onDropOnItem(targetKey: string) {
    if (!dragKey || dragKey === targetKey) return;
    onChange((prev) => {
      const from = prev.findIndex((item) => item.key === dragKey);
      const to = prev.findIndex((item) => item.key === targetKey);
      if (from < 0 || to < 0) return prev;
      const next = [...prev];
      const [item] = next.splice(from, 1);
      if (item) next.splice(to, 0, item);
      return next;
    });
    setDragKey(null);
  }

  function onZoneDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDropActive(false);
    if (event.dataTransfer.files.length) addFiles(event.dataTransfer.files);
  }

  return (
    <div>
      <div
        onDragOver={(event) => {
          if (event.dataTransfer.types.includes("Files")) {
            event.preventDefault();
            setDropActive(true);
          }
        }}
        onDragLeave={() => setDropActive(false)}
        onDrop={onZoneDrop}
        className={cn(
          "flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors",
          dropActive ? "border-gold bg-gold-soft/40" : "border-line bg-cream/40",
        )}
      >
        <ImagePlus aria-hidden className="size-7 text-gold-deep" strokeWidth={1.5} />
        <p className="mt-3 text-sm font-medium text-ink">Drag photos here, or</p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={items.length >= max}
          className="mt-2 inline-flex h-9 items-center rounded-lg bg-ink px-4 text-sm font-medium text-white disabled:opacity-40"
        >
          Choose images
        </button>
        <p className="mt-3 max-w-sm text-xs text-muted">
          JPEG, PNG or WebP · up to {max} images. Photos are resized and converted to WebP in your
          browser before uploading.
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES.join(",")}
          multiple
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={(event) => {
            if (event.target.files) addFiles(event.target.files);
            event.target.value = "";
          }}
        />
      </div>

      {items.length > 0 && (
        <>
          <p className="mt-4 text-xs text-muted">
            Drag to reorder (or use the arrows). The{" "}
            <Star aria-hidden className="inline size-3 fill-gold text-gold" /> primary image is
            shown on product cards.
          </p>
          <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {items.map((item, index) => {
              const isPrimary = item.key === primaryKey;
              const src = item.image_url ?? item.previewUrl;
              const busy = item.status === "optimizing" || item.status === "uploading";
              return (
                <li
                  key={item.key}
                  draggable={item.status === "ready"}
                  onDragStart={() => setDragKey(item.key)}
                  onDragEnd={() => setDragKey(null)}
                  onDragOver={(event) => {
                    if (dragKey) event.preventDefault();
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    onDropOnItem(item.key);
                  }}
                  className={cn(
                    "group overflow-hidden rounded-xl border bg-paper transition",
                    isPrimary ? "border-gold ring-2 ring-gold/30" : "border-line",
                    dragKey === item.key && "opacity-40",
                  )}
                >
                  <div className="relative aspect-square bg-cream-deep">
                    {src && (
                      <Image
                        src={src}
                        alt={item.alt_text || `Product image ${index + 1}`}
                        fill
                        sizes="200px"
                        className={cn("object-cover", busy && "opacity-60")}
                      />
                    )}
                    {isPrimary && (
                      <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-md bg-ink/90 px-2 py-1 text-[10px] font-semibold tracking-wider text-white uppercase">
                        <Star aria-hidden className="size-3 fill-gold text-gold" /> Primary
                      </span>
                    )}
                    {item.status === "ready" && (
                      <GripVertical
                        aria-hidden
                        className="absolute top-2 right-2 hidden size-5 cursor-grab rounded bg-paper/80 p-0.5 text-muted sm:block"
                      />
                    )}
                    {busy && (
                      <div className="absolute inset-x-3 bottom-3 rounded-md bg-paper/90 p-2 text-[11px] text-ink">
                        <div className="flex items-center gap-1.5">
                          <LoaderCircle aria-hidden className="size-3.5 animate-spin" />
                          {item.status === "optimizing"
                            ? "Optimising…"
                            : `Uploading ${Math.round(item.progress * 100)}%`}
                        </div>
                        <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-ink/10">
                          <div
                            className="h-full bg-gold transition-[width]"
                            style={{
                              width: `${item.status === "optimizing" ? 8 : Math.max(8, item.progress * 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}
                    {item.status === "error" && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-paper/90 p-3 text-center text-xs text-danger">
                        <CircleAlert aria-hidden className="size-5" />
                        {item.error}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-1 p-1.5">
                    <div className="flex">
                      <button
                        type="button"
                        onClick={() => move(item.key, -1)}
                        disabled={index === 0}
                        aria-label={`Move image ${index + 1} earlier`}
                        className="flex size-8 items-center justify-center rounded-md text-muted hover:bg-ink/5 disabled:opacity-30"
                      >
                        <ArrowLeft aria-hidden className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => move(item.key, 1)}
                        disabled={index === items.length - 1}
                        aria-label={`Move image ${index + 1} later`}
                        className="flex size-8 items-center justify-center rounded-md text-muted hover:bg-ink/5 disabled:opacity-30"
                      >
                        <ArrowRight aria-hidden className="size-4" />
                      </button>
                    </div>
                    <div className="flex">
                      <button
                        type="button"
                        onClick={() => setPrimary(item.key)}
                        disabled={item.status !== "ready" || isPrimary}
                        aria-label={
                          isPrimary
                            ? `Image ${index + 1} is the primary image`
                            : `Set image ${index + 1} as primary`
                        }
                        aria-pressed={isPrimary}
                        className="flex size-8 items-center justify-center rounded-md text-muted hover:bg-ink/5 disabled:opacity-60"
                      >
                        <Star
                          aria-hidden
                          className={cn("size-4", isPrimary && "fill-gold text-gold")}
                        />
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(item)}
                        disabled={busy}
                        aria-label={`Remove image ${index + 1}`}
                        className="flex size-8 items-center justify-center rounded-md text-muted hover:bg-danger/10 hover:text-danger disabled:opacity-30"
                      >
                        <Trash aria-hidden className="size-4" />
                      </button>
                    </div>
                  </div>
                  {item.status === "ready" && (
                    <div className="px-1.5 pb-1.5">
                      <input
                        aria-label={`Alt text for image ${index + 1}`}
                        value={item.alt_text}
                        maxLength={200}
                        onChange={(event) => patch(item.key, { alt_text: event.target.value })}
                        placeholder="Alt text (optional)"
                        className="h-8 w-full rounded-md border border-line px-2 text-xs outline-none focus:border-gold"
                      />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
