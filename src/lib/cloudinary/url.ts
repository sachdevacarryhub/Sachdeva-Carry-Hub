/** Inserts a Cloudinary transformation into an upload URL; other URLs pass through. */
export function cloudinaryTransform(url: string, transformation: string): string {
  if (!url.startsWith("https://res.cloudinary.com/") || !url.includes("/image/upload/")) return url;
  return url.replace("/image/upload/", `/image/upload/${transformation}/`);
}
