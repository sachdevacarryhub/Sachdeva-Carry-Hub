"use client";

import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/** Sticky header that gains a subtle blur + border once the page scrolls. */
export function NavbarShell({ children }: { children: ReactNode }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 isolate z-50 border-b transition-colors duration-300",
        scrolled ? "border-line/80" : "border-transparent",
      )}
    >
      {/* Blur lives on a background layer: a backdrop-filter on the header
          itself would trap the fixed-position mobile menu inside it. */}
      <div
        aria-hidden
        className={cn(
          "absolute inset-0 -z-10 transition-[background-color] duration-300",
          scrolled ? "bg-cream/85 backdrop-blur-md backdrop-saturate-150" : "bg-cream",
        )}
      />
      {children}
    </header>
  );
}
