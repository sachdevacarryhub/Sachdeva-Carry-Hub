import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";

interface LogoProps {
  /** "light" = for light backgrounds, "dark" = for dark backgrounds. */
  tone?: "light" | "dark";
  storeName: string;
  /** Optional logo uploaded in Store Information; replaces the bundled mark. */
  logoUrl?: string | null;
  href?: string;
  className?: string;
  priority?: boolean;
}

export function Logo({
  tone = "light",
  storeName,
  logoUrl,
  href = "/",
  className,
  priority,
}: LogoProps) {
  const dark = tone === "dark";
  const [first, ...rest] = storeName.split(" ");
  const src = logoUrl ?? (dark ? "/brand/logo-mark.png" : "/brand/logo-mark-dark.png");

  return (
    <Link
      href={href}
      aria-label={`${storeName} — home`}
      className={cn("group inline-flex items-center gap-3", className)}
    >
      <Image
        src={src}
        alt=""
        width={512}
        height={439}
        priority={priority}
        sizes="48px"
        className="h-9 w-auto sm:h-10"
      />
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "font-display text-[17px] font-semibold tracking-[0.14em] uppercase sm:text-lg",
            dark ? "text-white" : "text-ink",
          )}
        >
          {first}
        </span>
        {rest.length > 0 && (
          <span
            className={cn(
              "mt-1 text-[9.5px] font-semibold tracking-[0.42em] uppercase",
              dark ? "text-gold" : "text-gold-deep",
            )}
          >
            {rest.join(" ")}
          </span>
        )}
      </span>
    </Link>
  );
}
