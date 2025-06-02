import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@utils/supabase/middleware'

// Debug logging function
const debug = (...args: any[]) => {
  if (process.env.NEXT_PUBLIC_DEBUG === 'true') {
    console.log(...args)
  }
}

export async function middleware(request: NextRequest) {
  debug('🔍 Root Middleware - Request path:', request.nextUrl.pathname)

  // Maintenance mode logic
  const isMaintenanceMode = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true';
  const path = request.nextUrl.pathname;
  const isAuthPath = path.startsWith('/auth') || path === '/login' || path === '/signup' || path.startsWith('/api/v1/auth') || path === '/api/v1/user-profile';
  const isMaintenancePage = path === '/maintenance';

  if (isMaintenanceMode && !isAuthPath && !isMaintenancePage) {
    // Check if user is admin
    // Use the same logic as in utils/supabase/middleware.ts
    const { createServerClient } = await import('@supabase/ssr');
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          },
        },
      }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (token) {
        const response = await fetch(`${request.nextUrl.origin}/api/v1/user-profile`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const userProfile = await response.json();
          const isAdmin = userProfile.role === 'ADMIN' || userProfile.role === 'STAFF' || userProfile.role === 'MANAGER' || userProfile.role === 'OWNER';
          if (isAdmin) {
            // Allow admin through
            return await updateSession(request);
          }
        }
      }
    }
    // Not admin, redirect to /maintenance
    const url = request.nextUrl.clone();
    url.pathname = '/maintenance';
    return NextResponse.redirect(url);
  }

  // Default: update session and continue
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - api/ (API routes)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|api/|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}