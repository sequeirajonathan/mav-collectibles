import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { middlewareDebug } from '@utils/debug'

const PRIVATE_PATHS = ['/admin', '/profile', '/dashboard'];

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Check if maintenance mode is enabled
  const isMaintenanceMode = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true'
  middlewareDebug('Maintenance mode:', isMaintenanceMode)

  // Get the current path
  const path = request.nextUrl.pathname

  // Check if user is authenticated for login/signup redirect
  if (path === '/login' || path === '/signup') {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      middlewareDebug(`Authenticated user tried to access ${path} - redirecting to /dashboard`);
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }
  }

  // Only protect private paths
  const isPrivatePath = PRIVATE_PATHS.some((privatePath) =>
    path === privatePath || path.startsWith(`${privatePath}/`)
  )

  // Allow access to auth-related paths and maintenance page always
  const isAuthPath = path.startsWith('/auth') || 
                    path === '/login' || 
                    path === '/signup' ||
                    path.startsWith('/api/v1/auth') ||
                    path === '/api/v1/user-profile'
  const isMaintenancePage = path === '/maintenance'

  middlewareDebug('Auth path:', isAuthPath)
  middlewareDebug('Maintenance page:', isMaintenancePage)
  middlewareDebug('Private path:', isPrivatePath)

  // Maintenance mode logic
  if (isMaintenanceMode) {
    if (isAuthPath || isMaintenancePage) {
      middlewareDebug('Allowing access to auth/maintenance path')
      return supabaseResponse
    }
    // Only check admin for private paths during maintenance
    if (isPrivatePath) {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        middlewareDebug('No user for private path during maintenance, redirecting to login')
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
      }
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token
        if (token) {
          // Fetch user profile from our API using native fetch
          const response = await fetch(`${request.nextUrl.origin}/api/v1/user-profile`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })

          if (response.ok) {
            const userProfile = await response.json()
            middlewareDebug('User profile:', userProfile)
            
            // Verify email matches between Supabase and our database
            if (userProfile.email === user.email) {
              const isAdmin = userProfile.role === 'ADMIN' || 
                            userProfile.role === 'STAFF' || 
                            userProfile.role === 'MANAGER' || 
                            userProfile.role === 'OWNER'

              middlewareDebug('User role:', userProfile.role)
              middlewareDebug('Is admin:', isAdmin)

              // If user is admin, allow access
              if (isAdmin) {
                middlewareDebug('Admin access granted')
                return supabaseResponse
              }
            } else {
              middlewareDebug('Email mismatch between Supabase and database', null, 'warn')
            }
          } else {
            middlewareDebug('Failed to fetch user profile:', response.status, 'error')
          }
        }
      } catch (error) {
        middlewareDebug('Error checking user role:', error, 'error')
      }
      middlewareDebug('Not admin or not logged in, redirecting to maintenance')
      const url = request.nextUrl.clone()
      url.pathname = '/maintenance'
      return NextResponse.redirect(url)
    }
    // All other (public) routes allowed during maintenance
    return supabaseResponse
  }

  // If not in maintenance mode, only check auth for private paths
  if (isPrivatePath) {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      middlewareDebug('No user for private path, redirecting to login')
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
  }

  // All other (public) routes allowed
  return supabaseResponse
}