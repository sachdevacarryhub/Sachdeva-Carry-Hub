import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/auth/admin";
import { getStoreSettings } from "@/lib/data/public";

/**
 * Server-side gate for every admin page: unauthenticated users and signed-in
 * non-admins are redirected to the login page. Pages call requireAdmin()
 * again (memoised per request) before reading data.
 */
// Reads the session on every request, so it blocks instead of prerendering.
export const instant = false;

export default async function AdminPanelLayout({ children }: LayoutProps<"/admin">) {
  const [admin, settings] = await Promise.all([requireAdmin(), getStoreSettings()]);
  return (
    <AdminShell email={admin.email} storeName={settings.store_name}>
      {children}
    </AdminShell>
  );
}
