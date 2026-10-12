"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";
import { ImagePlaceholder, type BagKind } from "./bag-illustration";

type SmartImageProps = Omit<ImageProps, "src"> & {
  src: string | null | undefined;
  /** Illustration shown when there is no image or it fails to load. */
  fallbackKind?: BagKind;
  fallbackTone?: "light" | "dark";
  fallbackClassName?: string;
};

/**
 * next/image with a graceful fallback for missing or broken image URLs.
 * Intended for `fill` images inside a sized, relatively positioned parent.
 */
export function SmartImage({
  src,
  alt,
  fallbackKind = "bag",
  fallbackTone = "light",
  fallbackClassName,
  ...props
}: SmartImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (!src || failedSrc === src) {
    return (
      <ImagePlaceholder
        kind={fallbackKind}
        tone={fallbackTone}
        className={fallbackClassName}
        label={alt ? `${alt} (image coming soon)` : undefined}
      />
    );
  }

  return <Image src={src} alt={alt} onError={() => setFailedSrc(src)} {...props} />;
}
