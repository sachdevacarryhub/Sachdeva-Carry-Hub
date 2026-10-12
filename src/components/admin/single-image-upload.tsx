"use client";

import { ImagePlus, LoaderCircle, Trash } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { uploadImageWithProgress } from "@/lib/api/client";
import { ACCEPTED_IMAGE_TYPES, ImageValidationError, optimizeImage } from "@/lib/images/optimize";
import type { UploadedImage } from "@/types";

interface SingleImageUploadProps {
  value: { url: string; publicId: string | null } | null;
  folder: "categories" | "branding";
  onUploaded: (image: UploadedImage) => void;
  onRemove: () => void;
  aspect?: string;
  label: string;
}

/** One optimised image (category cover, logo). */
export function SingleImageUpload({
  value,
  folder,
  onUploaded,
  onRemove,
  aspect = "aspect-[16/9]",
  label,
}: SingleImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<{
    phase: "idle" | "optimizing" | "uploading";
    progress: number;
  }>({
    phase: "idle",
    progress: 0,
  });

  async function handleFile(file: File) {
    try {
      setState({ phase: "optimizing", progress: 0 });
      const optimized = await optimizeImage(file);
      setState({ phase: "uploading", progress: 0 });
      const result = await uploadImageWithProgress(optimized.blob, { folder }, (progress) =>
        setState({ phase: "uploading", progress }),
      );
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      onUploaded(result.data);
    } catch (error) {
      toast.error(
        error instanceof ImageValidationError
          ? error.message
          : "This image could not be processed.",
      );
    } finally {
      setState({ phase: "idle", progress: 0 });
    }
  }

  const busy = state.phase !== "idle";

  return (
    <div>
      <div
        className={`relative ${aspect} overflow-hidden rounded-xl border border-line bg-cream-deep`}
      >
        {value?.url ? (
          <Image src={value.url} alt={label} fill sizes="480px" className="object-cover" />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-sm text-muted">
            <ImagePlus aria-hidden className="mb-2 size-6 text-gold-deep" strokeWidth={1.5} />
            No image
          </div>
        )}
        {busy && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-paper/80 text-sm text-ink">
            <LoaderCircle aria-hidden className="size-5 animate-spin" />
            {state.phase === "optimizing"
              ? "Optimising…"
              : `Uploading ${Math.round(state.progress * 100)}%`}
          </div>
        )}
      </div>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-ink/80 px-3 text-sm font-medium disabled:opacity-40"
        >
          <ImagePlus aria-hidden className="size-4" />
          {value?.url ? "Replace image" : "Upload image"}
        </button>
        {value?.url && (
          <button
            type="button"
            onClick={onRemove}
            disabled={busy}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-danger hover:bg-danger/10 disabled:opacity-40"
          >
            <Trash aria-hidden className="size-4" /> Remove
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(",")}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleFile(file);
          event.target.value = "";
        }}
      />
    </div>
  );
}
