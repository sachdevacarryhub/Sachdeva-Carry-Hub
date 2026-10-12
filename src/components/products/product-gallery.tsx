"use client";

import { AnimatePresence, m, type PanInfo } from "framer-motion";
import { ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import Image from "next/image";
import { useEffect, useState, type KeyboardEvent, type MouseEvent } from "react";
import { ImagePlaceholder, type BagKind } from "@/components/shared/bag-illustration";
import { cn } from "@/lib/utils/cn";

export interface GalleryImage {
  id: string;
  src: string;
  alt: string;
}

interface ProductGalleryProps {
  images: GalleryImage[];
  productName: string;
  fallbackKind: BagKind;
}

const SWIPE_THRESHOLD = 50;

export function ProductGallery({ images, productName, fallbackKind }: ProductGalleryProps) {
  const [index, setIndex] = useState(0);
  const [failed, setFailed] = useState<Set<string>>(() => new Set());
  const [canHover, setCanHover] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState<string | null>(null);

  useEffect(() => {
    const query = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setCanHover(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  const count = images.length;
  const current = images[index];

  if (!current) {
    return (
      <div className="relative aspect-[4/5] overflow-hidden rounded-[20px] border border-line">
        <ImagePlaceholder kind={fallbackKind} label={`${productName} — photos coming soon`} />
      </div>
    );
  }

  const go = (next: number) => {
    setZoomOrigin(null);
    setIndex((next + count) % count);
  };

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (count < 2) return;
    if (event.key === "ArrowRight") {
      event.preventDefault();
      go(index + 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      go(index - 1);
    }
  }

  function onDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.x < -SWIPE_THRESHOLD) go(index + 1);
    else if (info.offset.x > SWIPE_THRESHOLD) go(index - 1);
  }

  function onMouseMove(event: MouseEvent<HTMLDivElement>) {
    if (!canHover) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    setZoomOrigin(`${x.toFixed(1)}% ${y.toFixed(1)}%`);
  }

  const isBroken = failed.has(current.id);

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label={`${productName} photos`}
      onKeyDown={onKeyDown}
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-[20px] border border-line bg-cream-deep">
        <AnimatePresence initial={false} mode="popLayout">
          <m.div
            key={current.id}
            className="absolute inset-0 touch-pan-y"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            drag={count > 1 && !canHover ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.18}
            onDragEnd={onDragEnd}
          >
            {isBroken ? (
              <ImagePlaceholder kind={fallbackKind} label={`${current.alt} (image unavailable)`} />
            ) : (
              <div
                className={cn("relative h-full w-full", canHover && "cursor-zoom-in")}
                onMouseMove={onMouseMove}
                onMouseLeave={() => setZoomOrigin(null)}
              >
                <Image
                  src={current.src}
                  alt={current.alt}
                  fill
                  priority={index === 0}
                  sizes="(min-width: 1024px) 58vw, 100vw"
                  draggable={false}
                  onError={() => setFailed((prev) => new Set(prev).add(current.id))}
                  className="object-cover transition-transform duration-200 ease-out select-none"
                  style={
                    zoomOrigin ? { transform: "scale(2)", transformOrigin: zoomOrigin } : undefined
                  }
                />
              </div>
            )}
          </m.div>
        </AnimatePresence>

        {canHover && !isBroken && !zoomOrigin && (
          <span className="pointer-events-none absolute right-4 bottom-4 hidden items-center gap-1.5 rounded-md bg-paper/85 px-2.5 py-1.5 text-[11px] font-medium text-ink shadow-sm backdrop-blur lg:inline-flex">
            <ZoomIn aria-hidden className="size-3.5" /> Hover to zoom
          </span>
        )}

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(index - 1)}
              aria-label="Previous image"
              className="absolute top-1/2 left-3 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-paper/85 text-ink shadow-sm backdrop-blur transition hover:bg-paper"
            >
              <ChevronLeft aria-hidden className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => go(index + 1)}
              aria-label="Next image"
              className="absolute top-1/2 right-3 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-paper/85 text-ink shadow-sm backdrop-blur transition hover:bg-paper"
            >
              <ChevronRight aria-hidden className="size-5" />
            </button>
            <p
              aria-live="polite"
              className="absolute bottom-4 left-4 rounded-md bg-ink/80 px-2.5 py-1 text-[11px] font-medium tracking-wider text-white"
            >
              {index + 1} / {count}
            </p>
          </>
        )}
      </div>

      {count > 1 && (
        <ul
          className="mt-4 flex scrollbar-none gap-3 overflow-x-auto pb-1"
          aria-label="Choose image"
        >
          {images.map((image, i) => (
            <li key={image.id} className="shrink-0">
              <button
                type="button"
                onClick={() => go(i)}
                aria-label={`Show image ${i + 1} of ${count}`}
                aria-current={i === index ? "true" : undefined}
                className={cn(
                  "relative block size-[72px] overflow-hidden rounded-xl border-2 bg-cream-deep transition sm:size-20",
                  i === index ? "border-gold" : "border-transparent opacity-70 hover:opacity-100",
                )}
              >
                {failed.has(image.id) ? (
                  <ImagePlaceholder kind={fallbackKind} />
                ) : (
                  <Image
                    src={image.src}
                    alt=""
                    fill
                    sizes="80px"
                    className="object-cover"
                    onError={() => setFailed((prev) => new Set(prev).add(image.id))}
                  />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
