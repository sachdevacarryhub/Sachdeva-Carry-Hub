import type { ReactNode } from "react";

/**
 * Re-mounts on navigation: a CSS-only fade + slight rise (no JS needed, so it
 * never delays first paint). Disabled automatically for reduced motion.
 */
export default function SiteTemplate({ children }: { children: ReactNode }) {
  return <div className="animate-page-in">{children}</div>;
}
