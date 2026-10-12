import { SmartImage } from "@/components/shared/smart-image";
import { bagKindFor } from "@/components/shared/bag-illustration";
import { cn } from "@/lib/utils/cn";
import type { Product } from "@/types";

export function primaryImage(product: Product) {
  return product.images.find((image) => image.is_primary) ?? product.images[0] ?? null;
}

export function ProductThumb({ product, className }: { product: Product; className?: string }) {
  const image = primaryImage(product);
  return (
    <div
      className={cn(
        "relative size-14 shrink-0 overflow-hidden rounded-lg border border-line bg-cream-deep",
        className,
      )}
    >
      <SmartImage
        src={image?.image_url}
        alt=""
        fill
        sizes="64px"
        className="object-cover"
        fallbackKind={bagKindFor(product.category?.slug ?? product.name)}
      />
    </div>
  );
}
