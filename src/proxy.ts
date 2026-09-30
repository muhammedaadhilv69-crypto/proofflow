import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  ROUTES,
  isGuestOnlyPath,
  isProtectedPath,
  safeRedirectTarget,
} from "@/lib/routes";

export async function proxy(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return new NextResponse(
      "Authentication is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
      { status: 503 },
    );
  }

  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request: { headers: request.headers } });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;

  if (isProtectedPath(pathname) && !user) {
    const redirectUrl = new URL(ROUTES.login, request.url);
    const target = safeRedirectTarget(pathname);
    if (target) redirectUrl.searchParams.set("redirect", target);
    return NextResponse.redirect(redirectUrl);
  }

  if (isGuestOnlyPath(pathname) && user)
    return NextResponse.redirect(new URL(ROUTES.dashboard, request.url));

  return response;
}

/**
 * Next.js parses this at build time, so every entry must be a literal string.
 * It cannot be derived from PROTECTED_PATHS or GUEST_ONLY_PATHS the way the
 * guard above is; `tests/routes.test.ts` asserts the two stay in sync.
 */
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/projects/:path*",
    "/clients/:path*",
    "/activity/:path*",
    "/settings/:path*",
    "/login",
    "/signup",
    "/forgot-password",
  ],
};
