"use client";

import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export default function SiteError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Container className="flex flex-col items-center py-24 text-center sm:py-32">
      <p className="text-eyebrow text-gold-deep">Something went wrong</p>
      <h1 className="mt-3 font-display text-4xl font-medium text-ink">
        We couldn&apos;t load this page
      </h1>
      <p className="mt-4 max-w-md leading-relaxed text-muted">
        This is usually temporary. Please try again, or come back in a few moments.
      </p>
      <div className="mt-9 flex flex-col gap-3 sm:flex-row">
        <button type="button" onClick={reset} className={buttonClasses({ size: "lg" })}>
          Try again
        </button>
        <Link href="/" className={buttonClasses({ variant: "secondary", size: "lg" })}>
          Back to Home
        </Link>
      </div>
    </Container>
  );
}
