import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { bagKindFor } from "@/components/shared/bag-illustration";
import { SmartImage } from "@/components/shared/smart-image";
import { cn } from "@/lib/utils/cn";
import type { ProductCardData } from "@/types";

interface ProductCardProps {
  product: ProductCardData;
  /** Load eagerly for above-the-fold cards. */
  priority?: boolean;
  className?: string;
}

export function ProductCard({ product, priority, className }: ProductCardProps) {
  const href = `/product/${product.slug}`;
  const alt = product.image?.alt_text || product.name;

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-(--radius-card) border border-line bg-paper shadow-(--shadow-card) transition-[box-shadow,transform,border-color] duration-500 ease-(--ease-premium) hover:-translate-y-1 hover:border-gold/40 hover:shadow-(--shadow-card-hover)",
        className,
      )}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-cream-deep">
        <div className="absolute inset-0 transition-transform duration-700 ease-(--ease-premium) group-hover:scale-[1.03]">
          <SmartImage
            src={product.image?.image_url}
            alt={alt}
            fill
            priority={priority}
            sizes="(min-width: 1280px) 300px, (min-width: 1024px) 25vw, (min-width: 420px) 50vw, 100vw"
            className="object-cover"
            fallbackKind={bagKindFor(product.category?.slug ?? product.name)}
          />
        </div>
        {(product.is_new_arrival || product.is_featured) && (
          <div className="absolute top-3 left-3 flex gap-1.5">
            {product.is_new_arrival && (
              <span className="rounded-md bg-ink/90 px-2.5 py-1 text-[10px] font-semibold tracking-[0.16em] text-white uppercase backdrop-blur">
                New
              </span>
            )}
            {product.is_featured && (
              <span className="rounded-md border border-gold/50 bg-paper/90 px-2.5 py-1 text-[10px] font-semibold tracking-[0.16em] text-gold-deep uppercase backdrop-blur">
                Featured
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        {product.category && (
          <p className="text-eyebrow mb-2 text-gold-deep">{product.category.name}</p>
        )}
        <h3 className="font-display text-lg leading-snug text-ink">
          {/* Stretched link makes the whole card clickable with one tab stop */}
          <Link
            href={href}
            className="after:absolute after:inset-0 focus-visible:outline-none after:focus-visible:rounded-(--radius-card) after:focus-visible:outline-2 after:focus-visible:outline-gold"
          >
            {product.name}
          </Link>
        </h3>
        {product.short_description && (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">
            {product.short_description}
          </p>
        )}
        <span
          aria-hidden
          className="mt-auto inline-flex items-center gap-1.5 pt-5 text-[13px] font-medium text-ink"
        >
          View Product
          <ArrowUpRight className="size-4 text-gold-deep transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </span>
      </div>
    </article>
  );
}
