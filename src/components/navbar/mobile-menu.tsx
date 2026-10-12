"use client";

import { AnimatePresence, m } from "framer-motion";
import { ArrowRight, Menu, Phone, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { InstagramIcon, WhatsAppIcon } from "@/components/ui/icons";
import { NAV_LINKS } from "./nav-links";

interface MobileMenuProps {
  phoneHref: string | null;
  whatsappHref: string | null;
  instagramUrl: string | null;
}

export function MobileMenu({ phoneHref, whatsappHref, instagramUrl }: MobileMenuProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    toggleRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusables = () =>
      Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>("a[href], button:not([disabled])") ?? [],
      );
    focusables()[0]?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== "Tab") return;
      // Keep focus inside the open menu.
      const items = [toggleRef.current, ...focusables()].filter(Boolean) as HTMLElement[];
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, close]);

  return (
    <div className="lg:hidden">
      <button
        ref={toggleRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((value) => !value)}
        className="relative z-50 -mr-2 flex size-11 items-center justify-center rounded-lg text-ink transition-colors hover:bg-ink/5"
      >
        {open ? (
          <X className="size-6" strokeWidth={1.5} />
        ) : (
          <Menu className="size-6" strokeWidth={1.5} />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <m.div
            key="menu"
            id={panelId}
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Site menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 top-16 z-40 flex flex-col overflow-y-auto bg-cream"
          >
            <nav aria-label="Mobile" className="px-6 pt-6">
              <ul className="divide-y divide-line border-y border-line">
                {NAV_LINKS.map((link, index) => (
                  <m.li
                    key={link.href}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 + index * 0.05, duration: 0.3 }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className="flex items-center justify-between py-5 font-display text-2xl text-ink"
                    >
                      {link.label}
                      <ArrowRight aria-hidden className="size-5 text-gold-deep" strokeWidth={1.5} />
                    </Link>
                  </m.li>
                ))}
              </ul>
            </nav>

            <div className="mt-auto space-y-3 px-6 pt-10 pb-[max(2rem,env(safe-area-inset-bottom))]">
              <Link
                href="/products"
                onClick={() => setOpen(false)}
                className="flex h-12 w-full items-center justify-center rounded-lg bg-ink text-sm font-medium tracking-wide text-white"
              >
                Explore Collection
              </Link>
              <div className="grid grid-cols-3 gap-3">
                {whatsappHref && (
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-12 items-center justify-center gap-2 rounded-lg border border-line bg-paper text-xs font-medium text-ink"
                  >
                    <WhatsAppIcon className="size-4" /> WhatsApp
                  </a>
                )}
                {phoneHref && (
                  <a
                    href={phoneHref}
                    className="flex h-12 items-center justify-center gap-2 rounded-lg border border-line bg-paper text-xs font-medium text-ink"
                  >
                    <Phone aria-hidden className="size-4" strokeWidth={1.75} /> Call
                  </a>
                )}
                {instagramUrl && (
                  <a
                    href={instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-12 items-center justify-center gap-2 rounded-lg border border-line bg-paper text-xs font-medium text-ink"
                  >
                    <InstagramIcon className="size-4" /> Instagram
                  </a>
                )}
              </div>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
