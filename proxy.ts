import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { accessFor, isAllowed } from "@lib/auth/access";
import { publicEnv, isMaintenanceMode } from "@lib/env";
import { parseRole, UserRole, ADMIN_PANEL_ROLES } from "@interfaces/roles";

/**
 * Single enforcement point for authentication and authorization.
 * 1. Refreshes the Supabase session cookie.
 * 2. Applies maintenance mode.
 * 3. Applies the route policy in lib/auth/access.ts.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const env = publicEnv();

  const supabase = createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // Verifies the access token (refreshing it when needed). Do not put code
  // between createServerClient and this call.
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const role: UserRole | null = claims
    ? parseRole((claims.app_metadata as Record<string, unknown> | undefined)?.role)
    : null;

  const { pathname } = request.nextUrl;
  const isApi = pathname.startsWith("/api/");

  // Carries refreshed session cookies onto redirects and error responses.
  const withCookies = (res: NextResponse) => {
    response.cookies.getAll().forEach((cookie) => res.cookies.set(cookie));
    return res;
  };
  const redirectTo = (path: string, params?: Record<string, string>) => {
    const url = request.nextUrl.clone();
    url.pathname = path;
    url.search = params ? `?${new URLSearchParams(params)}` : "";
    return withCookies(NextResponse.redirect(url));
  };

  // ---- Maintenance mode -----------------------------------------------------
  const maintenanceExempt =
    role !== null && (ADMIN_PANEL_ROLES.includes(role) || role === UserRole.PRINT_AGENT);
  const maintenanceOpenPath =
    pathname.startsWith("/maintenance") ||
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/auth/") ||
    // Print-agent screens are role-gated by the route policy below.
    pathname.startsWith("/print-agent");
  if (isMaintenanceMode() && !maintenanceExempt && !maintenanceOpenPath) {
    if (isApi) {
      return withCookies(NextResponse.json({ error: "Service temporarily unavailable" }, { status: 503 }));
    }
    return redirectTo("/maintenance");
  }

  // ---- Print agent desktop app (UX only; grants nothing) --------------------
  // The Electron app should always land on the print-agent screens.
  const userAgent = request.headers.get("user-agent") ?? "";
  const fromPrintAgentApp = userAgent.includes("mav-print") || userAgent.includes("Electron");
  if (fromPrintAgentApp && !isApi && !pathname.startsWith("/print-agent") && !pathname.startsWith("/auth/")) {
    return redirectTo("/print-agent");
  }

  // ---- Route policy ---------------------------------------------------------
  const access = accessFor(pathname, request.method);
  if (isAllowed(access, role)) return response;

  if (isApi) {
    return withCookies(
      NextResponse.json(
        { error: role === null ? "Unauthorized" : "Forbidden" },
        { status: role === null ? 401 : 403 }
      )
    );
  }

  if (pathname.startsWith("/print-agent")) {
    return redirectTo("/print-agent/login", role === null ? undefined : { error: "not_print_agent" });
  }
  if (role === null) {
    return redirectTo("/sign-in", { next: `${pathname}${request.nextUrl.search}` });
  }
  return redirectTo("/");
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
  ],
};
