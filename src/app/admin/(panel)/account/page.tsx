import { CircleCheck, CircleX } from "lucide-react";
import type { Metadata } from "next";
import { AdminPageTitle } from "@/components/admin/page-title";
import { PasswordForm } from "@/components/admin/password-form";
import { SignOutButton } from "@/components/admin/sign-out-button";
import { requireAdmin } from "@/lib/auth/admin";
import { isSupabaseConfigured, publicEnv } from "@/lib/env";
import { isCloudinaryConfigured } from "@/lib/env.server";

// Reads the session on every request, so it blocks instead of prerendering.
export const instant = false;

export const metadata: Metadata = { title: "Settings" };

function Status({ ok, label, detail }: { ok: boolean; label: string; detail: string }) {
  return (
    <li className="flex items-start gap-3 py-3.5">
      {ok ? (
        <CircleCheck aria-hidden className="mt-0.5 size-5 shrink-0 text-success" />
      ) : (
        <CircleX aria-hidden className="mt-0.5 size-5 shrink-0 text-danger" />
      )}
      <div>
        <p className="text-sm font-medium text-ink">
          {label} <span className="sr-only">{ok ? "configured" : "not configured"}</span>
        </p>
        <p className="text-xs text-muted">{detail}</p>
      </div>
    </li>
  );
}

export default async function AdminAccountPage() {
  const admin = await requireAdmin("/admin/account");

  return (
    <>
      <AdminPageTitle
        title="Settings"
        description="Your account and the website configuration status."
      />
      <div className="grid max-w-5xl gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-line bg-paper p-5 sm:p-6">
          <h2 className="font-semibold text-ink">Account</h2>
          <p className="mt-1 text-sm text-muted">Signed in as {admin.email ?? "administrator"}.</p>
          <div className="mt-6">
            <PasswordForm />
          </div>
          <div className="mt-6 max-w-[200px] rounded-lg bg-ink p-1">
            <SignOutButton />
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-paper p-5 sm:p-6">
          <h2 className="font-semibold text-ink">Configuration</h2>
          <p className="mt-1 text-sm text-muted">
            Environment variables are set in .env.local (local) or in Vercel (production).
          </p>
          <ul className="mt-4 divide-y divide-line">
            <Status
              ok={isSupabaseConfigured()}
              label="Supabase"
              detail="Database, authentication and row level security."
            />
            <Status
              ok={isCloudinaryConfigured()}
              label="Cloudinary"
              detail="Image uploads and CDN delivery (server-side credentials)."
            />
            <Status
              ok={Boolean(publicEnv.siteUrl)}
              label="Website URL"
              detail={
                publicEnv.siteUrl ??
                "NEXT_PUBLIC_SITE_URL — required for QR codes, sitemap and canonical URLs."
              }
            />
          </ul>
        </section>
      </div>
    </>
  );
}
