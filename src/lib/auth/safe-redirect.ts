/** Only allow redirects back into the admin area (prevents open redirects). */
export function safeAdminRedirect(value: string | null | undefined): string {
  if (!value || typeof value !== "string") return "/admin";
  if (!value.startsWith("/admin") || value.startsWith("//") || value.includes("\\"))
    return "/admin";
  if (value.startsWith("/admin/login")) return "/admin";
  return value;
}
