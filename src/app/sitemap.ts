import type { MetadataRoute } from "next";
import { getPublicSlugs } from "@/lib/data/public";
import { getMetadataBase } from "@/lib/env";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getMetadataBase().toString().replace(/\/$/, "");
  const { products, categories } = await getPublicSlugs();

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/products`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/contact`, changeFrequency: "monthly", priority: 0.6 },
  ];

  return [
    ...staticPages,
    ...categories.map((category) => ({
      url: `${base}/category/${category.slug}`,
      lastModified: category.updated_at,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...products.map((product) => ({
      url: `${base}/product/${product.slug}`,
      lastModified: product.updated_at,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
