import { NextResponse, type NextRequest } from "next/server";
import { safeAdminRedirect } from "@/lib/auth/safe-redirect";
import { updateSession } from "@/lib/supabase/proxy";

/**
 * Keeps the Supabase session fresh and gives admin pages clean HTTP redirects.
 *
 * This is an *optimistic* layer for UX. It is NOT the security boundary:
 * every admin page, API route and database policy re-checks authorization.
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isAdminPage = pathname === "/admin" || pathname.startsWith("/admin/");
  const isLoginPage = pathname === "/admin/login";

  const { response, userId, isAdmin } = await updateSession(request, { checkAdmin: isAdminPage });

  const redirectTo = (url: URL) => {
    const redirect = NextResponse.redirect(url);
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  };

  if (isAdminPage && !isLoginPage && !isAdmin) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/admin/login";
    loginUrl.search = "";
    loginUrl.searchParams.set("next", `${pathname}${search}`);
    // Signed in but not listed in admin_users.
    if (userId) loginUrl.searchParams.set("error", "forbidden");
    return redirectTo(loginUrl);
  }

  if (isLoginPage && isAdmin) {
    const next = safeAdminRedirect(request.nextUrl.searchParams.get("next"));
    return redirectTo(new URL(next, request.url));
  }

  return response;
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/api/:path*"],
};
