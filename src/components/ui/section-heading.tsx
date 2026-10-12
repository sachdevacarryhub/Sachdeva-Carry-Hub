import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface SectionHeadingProps {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  action?: { href: string; label: string };
  align?: "left" | "center";
  tone?: "light" | "dark";
  as?: "h1" | "h2";
  className?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  align = "left",
  tone = "light",
  as: Heading = "h2",
  className,
}: SectionHeadingProps) {
  const dark = tone === "dark";
  return (
    <div
      className={cn(
        "flex flex-col gap-6 md:flex-row md:items-end md:justify-between",
        align === "center" && "items-center text-center md:flex-col md:items-center",
        className,
      )}
    >
      <div className={cn("max-w-2xl", align === "center" && "mx-auto")}>
        {eyebrow && (
          <p className={cn("text-eyebrow mb-3", dark ? "text-gold" : "text-gold-deep")}>
            {eyebrow}
          </p>
        )}
        <Heading
          className={cn(
            "font-display text-3xl leading-[1.15] font-medium tracking-tight sm:text-4xl",
            dark ? "text-white" : "text-ink",
          )}
        >
          {title}
        </Heading>
        {description && (
          <p
            className={cn(
              "mt-4 text-[15px] leading-relaxed sm:text-base",
              dark ? "text-white/65" : "text-muted",
            )}
          >
            {description}
          </p>
        )}
      </div>
      {action && (
        <Link
          href={action.href}
          className={cn(
            "group inline-flex shrink-0 items-center gap-2 border-b pb-1 text-sm font-medium transition-colors",
            dark
              ? "border-white/30 text-white hover:border-gold"
              : "border-ink/30 text-ink hover:border-gold",
          )}
        >
          {action.label}
          <ArrowRight
            aria-hidden
            className="size-4 transition-transform duration-300 group-hover:translate-x-1"
          />
        </Link>
      )}
    </div>
  );
}
