"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { cn } from "@/lib/utils/cn";
import { NAV_LINKS, isActivePath } from "./nav-links";

function NavList({ pathname }: { pathname: string | null }) {
  return (
    <ul className="flex items-center gap-8">
      {NAV_LINKS.map((link) => {
        const active = isActivePath(pathname, link.href);
        return (
          <li key={link.href}>
            <Link
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative py-2 text-[13.5px] font-medium tracking-wide transition-colors",
                "after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:bg-gold after:transition-transform after:duration-300",
                active
                  ? "text-ink after:scale-x-100"
                  : "text-ink/70 after:scale-x-0 hover:text-ink hover:after:scale-x-100",
              )}
            >
              {link.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function ActiveNavList() {
  return <NavList pathname={usePathname()} />;
}

export function DesktopNav() {
  return (
    <nav aria-label="Main" className="hidden lg:block">
      {/* usePathname may suspend on not-yet-generated product URLs */}
      <Suspense fallback={<NavList pathname={null} />}>
        <ActiveNavList />
      </Suspense>
    </nav>
  );
}
