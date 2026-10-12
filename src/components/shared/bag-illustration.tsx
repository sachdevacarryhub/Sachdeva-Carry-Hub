import type { SVGProps } from "react";

export type BagKind = "trolley" | "backpack" | "handbag" | "bag";

/** Picks an illustration from a category slug/name, for image fallbacks. */
export function bagKindFor(text: string | null | undefined): BagKind {
  const value = (text ?? "").toLowerCase();
  if (/(trolley|luggage|suitcase|cabin)/.test(value)) return "trolley";
  if (/(school|backpack|college|rucksack)/.test(value)) return "backpack";
  if (/(purse|handbag|ladies|sling|clutch|tote)/.test(value)) return "handbag";
  return "bag";
}

const shared: SVGProps<SVGSVGElement> = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.4,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  viewBox: "0 0 120 160",
};

/** Thin line-art bag illustrations used as elegant image placeholders. */
export function BagIllustration({ kind, ...props }: { kind: BagKind } & SVGProps<SVGSVGElement>) {
  switch (kind) {
    case "trolley":
      return (
        <svg {...shared} aria-hidden {...props}>
          <path d="M50 32V12a4 4 0 0 1 4-4h12a4 4 0 0 1 4 4v20" />
          <path d="M55 32V14h10v18" />
          <rect x="26" y="32" width="68" height="108" rx="10" />
          <path d="M44 44v84M60 44v84M76 44v84" />
          <path d="M26 52h68" opacity=".5" />
          <circle cx="38" cy="147" r="5" />
          <circle cx="82" cy="147" r="5" />
        </svg>
      );
    case "backpack":
      return (
        <svg {...shared} aria-hidden {...props}>
          <path d="M48 26a12 12 0 0 1 24 0" />
          <path d="M28 58a32 32 0 0 1 64 0v80a8 8 0 0 1-8 8H36a8 8 0 0 1-8-8Z" />
          <path d="M36 66h48" />
          <rect x="40" y="96" width="40" height="38" rx="6" />
          <path d="M40 108h40" />
          <path d="M60 104v8" />
        </svg>
      );
    case "handbag":
      return (
        <svg {...shared} aria-hidden {...props}>
          <path d="M42 62V50a18 18 0 0 1 36 0v12" />
          <path d="M22 62h76l8 76a8 8 0 0 1-8 9H22a8 8 0 0 1-8-9Z" />
          <path d="M20 82h80" />
          <rect x="54" y="76" width="12" height="12" rx="2" />
        </svg>
      );
    default:
      return (
        <svg {...shared} aria-hidden {...props}>
          <path d="M44 52V40a16 16 0 0 1 32 0v12" />
          <rect x="18" y="52" width="84" height="92" rx="10" />
          <path d="M18 76h84" />
        </svg>
      );
  }
}

/** Full-bleed placeholder panel with an illustration. */
export function ImagePlaceholder({
  kind = "bag",
  label,
  tone = "light",
  className = "",
}: {
  kind?: BagKind;
  label?: string;
  tone?: "light" | "dark";
  className?: string;
}) {
  const dark = tone === "dark";
  return (
    <div
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={`relative flex h-full w-full items-center justify-center overflow-hidden ${
        dark ? "bg-ink text-gold/70" : "bg-cream-deep text-gold-deep/45"
      } ${className}`}
    >
      <div
        aria-hidden
        className={`absolute inset-6 rounded-[12px] border ${dark ? "border-white/8" : "border-ink/6"}`}
      />
      <BagIllustration kind={kind} className="relative h-1/2 max-h-56 w-auto" />
    </div>
  );
}
