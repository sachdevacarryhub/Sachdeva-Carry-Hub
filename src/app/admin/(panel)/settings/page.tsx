import type { Metadata } from "next";
import { AdminPageTitle } from "@/components/admin/page-title";
import { SettingsForm } from "@/components/admin/settings-form";
import { requireAdmin } from "@/lib/auth/admin";
import { getAdminSettings } from "@/lib/data/admin";

// Reads the session on every request, so it blocks instead of prerendering.
export const instant = false;

export const metadata: Metadata = { title: "Store Information" };

export default async function AdminSettingsPage() {
  const { supabase } = await requireAdmin("/admin/settings");
  const settings = await getAdminSettings(supabase);

  return (
    <>
      <AdminPageTitle
        title="Store Information"
        description="Business details used across the website: navbar, footer, contact page, WhatsApp and Call buttons."
      />
      <SettingsForm key={settings.updated_at ?? "new"} settings={settings} />
    </>
  );
}
