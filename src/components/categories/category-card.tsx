import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { bagKindFor } from "@/components/shared/bag-illustration";
import { SmartImage } from "@/components/shared/smart-image";
import type { Category } from "@/types";

/** Large editorial category card. */
export function CategoryCard({ category, index }: { category: Category; index?: number }) {
  return (
    <Link
      href={`/category/${category.slug}`}
      className="group relative block aspect-[4/5] overflow-hidden rounded-(--radius-card) bg-ink text-white shadow-(--shadow-card) sm:aspect-[3/4]"
    >
      <div className="absolute inset-0 transition-transform duration-700 ease-(--ease-premium) group-hover:scale-[1.04]">
        <SmartImage
          src={category.image_url}
          alt=""
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
          className="object-cover"
          fallbackKind={bagKindFor(category.slug)}
          fallbackTone="dark"
          fallbackClassName="pb-[38%]"
        />
      </div>
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent"
      />
      <div className="absolute inset-x-0 bottom-0 p-6 sm:p-7">
        {typeof index === "number" && (
          <p className="text-eyebrow mb-3 text-gold">{String(index + 1).padStart(2, "0")}</p>
        )}
        <h3 className="font-display text-2xl leading-tight sm:text-[28px]">{category.name}</h3>
        {category.description && (
          <p className="mt-2 line-clamp-2 max-w-sm text-sm leading-relaxed text-white/70">
            {category.description}
          </p>
        )}
        <span className="mt-5 inline-flex items-center gap-2 border-b border-white/30 pb-1 text-[13px] font-medium tracking-wide transition-colors group-hover:border-gold">
          Explore
          <ArrowRight
            aria-hidden
            className="size-4 transition-transform duration-300 group-hover:translate-x-1"
          />
        </span>
      </div>
    </Link>
  );
}
