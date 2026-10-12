"use client";

import { CircleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      role="alert"
      className="mx-auto mt-10 max-w-lg rounded-2xl border border-line bg-paper p-8 text-center"
    >
      <CircleAlert aria-hidden className="mx-auto size-8 text-danger" />
      <h1 className="mt-4 text-lg font-semibold text-ink">Something went wrong</h1>
      <p className="mt-2 text-sm text-muted">
        The data could not be loaded. Check your connection and that Supabase is configured, then
        try again.
      </p>
      <Button size="sm" className="mt-6" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
