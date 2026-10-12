import Link from "next/link";
import { BagIllustration } from "@/components/shared/bag-illustration";
import { buttonClasses } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export function NotFoundContent() {
  return (
    <Container className="flex flex-col items-center py-24 text-center sm:py-32">
      <BagIllustration kind="trolley" className="h-28 w-auto text-gold-deep/60" />
      <p className="text-eyebrow mt-8 text-gold-deep">Error 404</p>
      <h1 className="mt-3 font-display text-4xl font-medium text-ink sm:text-5xl">
        This page has travelled on
      </h1>
      <p className="mt-4 max-w-md leading-relaxed text-muted">
        The product or page you are looking for isn&apos;t available. It may have been removed or
        the link may be incorrect.
      </p>
      <div className="mt-9 flex flex-col gap-3 sm:flex-row">
        <Link href="/products" className={buttonClasses({ size: "lg" })}>
          Explore Collection
        </Link>
        <Link href="/" className={buttonClasses({ variant: "secondary", size: "lg" })}>
          Back to Home
        </Link>
      </div>
    </Container>
  );
}
