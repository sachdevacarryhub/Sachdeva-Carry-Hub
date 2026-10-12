import type { Metadata } from "next";
import { Toaster } from "sonner";

// Admin pages read the session cookie on every request, so they are allowed
// to block rather than being prerendered into a static shell.
export const instant = false;

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin" },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: LayoutProps<"/admin">) {
  return (
    <>
      {children}
      <Toaster position="top-right" richColors closeButton />
    </>
  );
}
