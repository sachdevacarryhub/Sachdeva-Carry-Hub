export const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Collections" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
] as const;

export function isActivePath(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  if (href === "/") return pathname === "/";
  if (href === "/products") {
    return (
      pathname.startsWith("/products") ||
      pathname.startsWith("/category") ||
      pathname.startsWith("/product/")
    );
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
