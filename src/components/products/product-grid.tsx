import { cn } from "@/lib/utils/cn";
import type { ProductCardData } from "@/types";
import { ProductCard } from "./product-card";

interface ProductGridProps {
  products: ProductCardData[];
  /** Number of leading cards to load eagerly. */
  priorityCount?: number;
  className?: string;
}

/** Desktop 4 cols · tablet 2 · mobile 1 (2 from 420px). */
export function ProductGrid({ products, priorityCount = 0, className }: ProductGridProps) {
  return (
    <ul
      className={cn(
        "grid grid-cols-1 gap-x-5 gap-y-8 min-[420px]:grid-cols-2 lg:grid-cols-4",
        className,
      )}
    >
      {products.map((product, index) => (
        <li key={product.id}>
          <ProductCard product={product} priority={index < priorityCount} />
        </li>
      ))}
    </ul>
  );
}
