import { NextResponse, type NextRequest } from "next/server";

const PROTECTED = ["/dashboard", "/admin"];
const PUBLIC_EXCEPTIONS = ["/admin/login"];

/**
 * First gate only: bounces visitors with no session cookie away from protected areas.
 * The cookie is NOT trusted for access: every protected page and server action re-validates
 * the session and role against the database.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const needsAuth =
    PROTECTED.some((p) => pathname === p || pathname.startsWith(p + "/")) && !PUBLIC_EXCEPTIONS.includes(pathname);
  if (needsAuth && !request.cookies.get("gbw_session")?.value) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.startsWith("/admin") ? "/admin/login" : "/login";
    url.search = `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
