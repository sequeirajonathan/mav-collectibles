import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@lib/supabase/middleware";
import { createServerClient } from "@supabase/ssr";

const MAINTENANCE_MODE = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true";

export async function middleware(request: NextRequest) {
  const response = await updateSession(request);
  const finalResponse = response || NextResponse.next();

  finalResponse.headers.set("Access-Control-Allow-Origin", "*");
  finalResponse.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  finalResponse.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );

  const url = request.nextUrl.clone();
  const pathname = url.pathname;

  // Define paths that should be accessible during maintenance
  const isApiRoute = pathname.startsWith("/api");
  const isAdminRoute = pathname.startsWith("/admin");
  const isMaintenancePage = pathname === "/maintenance";
  const isLoginRoute = pathname.startsWith("/login");
  const isStaticAsset = pathname.match(
    /\.(jpg|jpeg|png|gif|ico|css|js|svg|webp)$/
  );
  const isNextInternal = pathname.startsWith("/_next");

  // Skip checks for API, static assets, and Next.js internal routes
  if (isApiRoute || isStaticAsset || isNextInternal) return finalResponse;

  // Create Supabase client once
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: () => {},
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // During maintenance, only allow admin users, /admin, /maintenance, and /login paths
  if (MAINTENANCE_MODE && !isMaintenancePage && !isLoginRoute) {
    if (user) {
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("role")
        .eq("email", user.email)
        .single();

      const isStaffOrHigher = profile?.role && profile.role !== "CUSTOMER";

      if (!isStaffOrHigher) {
        url.pathname = "/maintenance";
        return NextResponse.redirect(url);
      }
    } else {
      // Not logged in: redirect to maintenance page
      url.pathname = "/maintenance";
      return NextResponse.redirect(url);
    }
  }

  // If maintenance mode is off and trying to access maintenance page, redirect to home
  if (!MAINTENANCE_MODE && isMaintenancePage) {
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // Redirect unauthenticated users on /admin to login
  if (isAdminRoute && !user) {
    url.pathname = "/login";
    url.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(url);
  }

  return finalResponse;
}

export const config = {
  matcher: [
    // Match API routes for CORS
    "/api/:path*",
    // Match all request paths except for the ones starting with:
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - favicon.ico (favicon file)
    // And except for image files
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
