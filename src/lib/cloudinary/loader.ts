"use client";

interface LoaderArgs {
  src: string;
  width: number;
  quality?: number;
}

/**
 * Global next/image loader.
 *
 * Cloudinary URLs get on-the-fly resizing + automatic format/quality
 * (served from Cloudinary's CDN). Any other source is returned unchanged.
 */
export default function imageLoader({ src, width, quality }: LoaderArgs): string {
  if (src.startsWith("https://res.cloudinary.com/") && src.includes("/image/upload/")) {
    const q = quality ? `q_${quality}` : "q_auto";
    return src.replace("/image/upload/", `/image/upload/f_auto,${q},c_limit,w_${width}/`);
  }
  if (src.startsWith("/")) {
    // Local static asset: width param keeps URLs unique per size.
    return `${src}${src.includes("?") ? "&" : "?"}w=${width}`;
  }
  return src;
}
