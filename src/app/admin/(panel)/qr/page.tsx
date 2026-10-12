import { CircleAlert } from "lucide-react";
import type { Metadata } from "next";
import { AdminPageTitle } from "@/components/admin/page-title";
import { QrGenerator } from "@/components/qr/qr-generator";
import { requireAdmin } from "@/lib/auth/admin";
import { getAdminSettings, listAdminProducts } from "@/lib/data/admin";
import { publicEnv } from "@/lib/env";

// Reads the session on every request, so it blocks instead of prerendering.
export const instant = false;

export const metadata: Metadata = { title: "QR Codes" };

export default async function AdminQrPage({ searchParams }: PageProps<"/admin/qr">) {
  const { supabase } = await requireAdmin("/admin/qr");
  const [products, settings, params] = await Promise.all([
    listAdminProducts(supabase),
    getAdminSettings(supabase),
    searchParams,
  ]);
  const initialProductId = typeof params.product === "string" ? params.product : undefined;

  return (
    <>
      <AdminPageTitle
        title="QR Codes"
        description="Generate QR codes for product stickers and for the website. Codes are generated on demand."
      />

      {!publicEnv.siteUrl ? (
        <div
          role="alert"
          className="flex gap-3 rounded-2xl border border-danger/30 bg-danger/5 p-5 text-sm text-ink"
        >
          <CircleAlert aria-hidden className="mt-0.5 size-5 shrink-0 text-danger" />
          <div>
            <p className="font-semibold">Website URL is not configured</p>
            <p className="mt-1 text-muted">
              {publicEnv.siteUrlInvalid
                ? "NEXT_PUBLIC_SITE_URL is not a valid URL."
                : "NEXT_PUBLIC_SITE_URL is missing."}{" "}
              Set it to your public domain (for example <code>https://sachdevacarryhub.in</code>) in
              .env.local or in Vercel, then rebuild. QR codes are disabled to avoid printing broken
              codes.
            </p>
          </div>
        </div>
      ) : (
        <QrGenerator
          siteUrl={publicEnv.siteUrl}
          storeName={settings.store_name}
          initialProductId={initialProductId}
          products={products.map((product) => ({
            id: product.id,
            name: product.name,
            slug: product.slug,
            is_active: product.is_active,
            category: product.category?.name ?? null,
          }))}
        />
      )}
    </>
  );
}
