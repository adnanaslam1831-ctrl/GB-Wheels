import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "@/lib/supabase/env";

const PROTECTED = ["/dashboard", "/admin"];
const PUBLIC_EXCEPTIONS = ["/admin/login"];

/**
 * Refreshes the Supabase session cookie on every matched request and redirects
 * signed-out visitors away from protected areas. This is only a first gate:
 * server layouts and every server action re-verify the user and role.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const needsAuth =
    PROTECTED.some((p) => pathname === p || pathname.startsWith(p + "/")) &&
    !PUBLIC_EXCEPTIONS.includes(pathname);

  if (!isSupabaseConfigured) {
    if (needsAuth) {
      const url = request.nextUrl.clone();
      url.pathname = pathname.startsWith("/admin") ? "/admin/login" : "/login";
      url.search = "";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (needsAuth && !user) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.startsWith("/admin") ? "/admin/login" : "/login";
    url.search = `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|ico)$).*)"],
};
