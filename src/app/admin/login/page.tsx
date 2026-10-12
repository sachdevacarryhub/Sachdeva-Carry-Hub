import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/login-form";
import { getAdminStatus } from "@/lib/auth/admin";
import { safeAdminRedirect } from "@/lib/auth/safe-redirect";

// Reads the session on every request, so it blocks instead of prerendering.
export const instant = false;

export const metadata: Metadata = { title: "Sign in" };

export default async function AdminLoginPage({ searchParams }: PageProps<"/admin/login">) {
  const params = await searchParams;
  const next = safeAdminRedirect(typeof params.next === "string" ? params.next : null);
  const status = await getAdminStatus();

  if (status.status === "admin") redirect(next);

  const notice =
    status.status === "unconfigured"
      ? "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local and restart the server."
      : status.status === "forbidden"
        ? `${status.email ?? "This account"} is signed in but is not an administrator.`
        : null;

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-ink lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(80%_60%_at_20%_10%,rgba(201,151,43,0.18),transparent_60%)]"
        />
        <Image
          src="/brand/logo-full.png"
          alt="Sachdeva Carry Hub"
          width={700}
          height={449}
          priority
          className="relative w-72"
        />
        <p className="relative max-w-sm text-sm leading-relaxed text-white/55">
          Manage the digital showroom: products, categories, QR codes and store information.
        </p>
      </div>

      <div className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-sm">
          <Image
            src="/brand/logo-mark-dark.png"
            alt=""
            width={512}
            height={439}
            className="mb-8 h-12 w-auto lg:hidden"
          />
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Admin sign in</h1>
          <p className="mt-1.5 text-sm text-muted">Use your administrator email and password.</p>
          <LoginForm
            next={next}
            notice={notice}
            disabled={status.status === "unconfigured"}
            signedInNonAdmin={status.status === "forbidden"}
          />
        </div>
      </div>
    </div>
  );
}
