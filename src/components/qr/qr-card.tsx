"use client";

import { Check, Copy, Download, LoaderCircle, Printer } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";

interface QrCardProps {
  title: string;
  subtitle?: string;
  url: string;
  /** API endpoint without query string, e.g. /api/qr/site */
  endpoint: string;
  /** Text printed under the code. */
  printCaption: string;
  /** Print label size. */
  printSizeMm?: number;
}

const actionClass =
  "inline-flex h-10 items-center justify-center gap-2 rounded-lg border px-3.5 text-sm font-medium transition-colors";

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
}

export function QrCard({
  title,
  subtitle,
  url,
  endpoint,
  printCaption,
  printSizeMm = 60,
}: QrCardProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [copied, setCopied] = useState(false);
  const preview = `${endpoint}?format=svg`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Could not copy the link.");
    }
  }

  function print() {
    // A clean, isolated print document: QR + caption only, at a fixed physical size.
    const frame = document.createElement("iframe");
    frame.setAttribute("aria-hidden", "true");
    frame.style.cssText = "position:fixed;width:0;height:0;border:0;right:0;bottom:0;";
    document.body.appendChild(frame);
    const doc = frame.contentDocument;
    if (!doc) {
      frame.remove();
      toast.error("Printing is not available in this browser.");
      return;
    }
    doc.open();
    doc.write(`<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
<style>
  @page { margin: 12mm; }
  body { margin: 0; font-family: Inter, Arial, sans-serif; color: #111; display: flex; justify-content: center; }
  .label { text-align: center; padding: 6mm; border: 0.3mm dashed #bbb; border-radius: 3mm; }
  img { width: ${printSizeMm}mm; height: ${printSizeMm}mm; display: block; margin: 0 auto; }
  h1 { font-size: 11pt; margin: 3mm 0 1mm; font-weight: 600; }
  p { font-size: 7.5pt; margin: 0; color: #555; word-break: break-all; max-width: ${printSizeMm + 10}mm; }
  .scan { font-size: 8pt; letter-spacing: 0.15em; text-transform: uppercase; color: #8a6418; margin-top: 2mm; }
</style></head><body><div class="label">
  <img src="${escapeHtml(`${window.location.origin}${endpoint}?format=svg`)}" alt="">
  <h1>${escapeHtml(printCaption)}</h1>
  <p>${escapeHtml(url)}</p>
  <div class="scan">Scan to view</div>
</div></body></html>`);
    doc.close();
    const img = doc.querySelector("img");
    const run = () => {
      frame.contentWindow?.focus();
      frame.contentWindow?.print();
      setTimeout(() => frame.remove(), 1000);
    };
    if (img && !img.complete) {
      img.onload = run;
      img.onerror = () => {
        frame.remove();
        toast.error("The QR code could not be loaded for printing.");
      };
    } else {
      run();
    }
  }

  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
      <div className="relative mx-auto size-56 shrink-0 overflow-hidden rounded-xl border border-line bg-white p-3 sm:mx-0">
        {!loaded && !failed && (
          <div className="absolute inset-0 flex items-center justify-center text-muted">
            <LoaderCircle aria-hidden className="size-6 animate-spin" />
            <span className="sr-only">Generating QR code…</span>
          </div>
        )}
        {failed ? (
          <p className="flex h-full items-center justify-center p-4 text-center text-sm text-danger">
            The QR code could not be generated.
          </p>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- authenticated, dynamically generated SVG
          <img
            key={preview}
            src={preview}
            alt={`QR code for ${url}`}
            width={512}
            height={512}
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
            className={cn("size-full transition-opacity", loaded ? "opacity-100" : "opacity-0")}
          />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="text-lg font-semibold text-ink">{title}</h3>
        {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-line bg-cream/50 p-1 pl-3">
          <code className="min-w-0 flex-1 truncate text-[13px] text-ink">{url}</code>
          <button
            type="button"
            onClick={copy}
            aria-label="Copy link"
            className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted hover:bg-paper hover:text-ink"
          >
            {copied ? (
              <Check aria-hidden className="size-4 text-success" />
            ) : (
              <Copy aria-hidden className="size-4" />
            )}
          </button>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <a
            href={`${endpoint}?format=png&download=1`}
            download
            className={cn(actionClass, "border-ink bg-ink text-white hover:bg-ink-soft")}
          >
            <Download aria-hidden className="size-4" /> PNG
          </a>
          <a
            href={`${endpoint}?format=svg&download=1`}
            download
            className={cn(actionClass, "border-ink/80 text-ink hover:border-gold")}
          >
            <Download aria-hidden className="size-4" /> SVG
          </a>
          <button
            type="button"
            onClick={print}
            disabled={failed}
            className={cn(
              actionClass,
              "border-ink/80 text-ink hover:border-gold disabled:opacity-40",
            )}
          >
            <Printer aria-hidden className="size-4" /> Print
          </button>
        </div>
        <p className="mt-3 text-xs text-muted">
          PNG (1024px) for phones and messaging · SVG for sharp printing at any size.
        </p>
      </div>
    </div>
  );
}
