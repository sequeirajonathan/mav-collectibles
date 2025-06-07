import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { isAdminRole, UserRoleType } from '@interfaces/roles'

// Define the type for user metadata
type UserMetadata = {
  role?: UserRoleType;
}

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)', 
  '/sign-up(.*)',
  '/api/v1/feature-flags(.*)',
  '/api/v1/alert-banner(.*)',
  '/api/v1/featured-events(.*)',
  '/api/v1/video-settings/current(.*)',
  '/api/v1/google-reviews(.*)',
  '/api/v1/category(.*)',
  '/api/v1/search(.*)',
  '/api/v1/search-square-customer(.*)',
  '/api/v1/create-square-customer(.*)',
  '/api/v1/update-square-customer(.*)',
  '/',         // Make home page public
  '/events(.*)', // Make events pages public
  '/category(.*)', // Make category pages public
  '/search(.*)', // Make search pages public
  '/cart(.*)', // Make cart pages public
  '/maintenance(.*)', // Make maintenance page public
])

export default clerkMiddleware(async (auth, req) => {
  // Get session claims
  const { sessionClaims } = await auth()
  const metadata = sessionClaims?.metadata as UserMetadata | undefined
  const isMaintenanceMode = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true'
  const isAdmin = metadata?.role ? isAdminRole(metadata.role) : false
  const isMaintenancePage = req.nextUrl.pathname.startsWith('/maintenance')

  // If maintenance mode is active and user is not admin
  if (isMaintenanceMode && !isAdmin && !isMaintenancePage) {
    return NextResponse.redirect(new URL('/maintenance', req.url))
  }

  // If maintenance mode is active and user is admin, allow access to all routes
  if (isMaintenanceMode && isAdmin) {
    return NextResponse.next()
  }

  // If the request is not for a public route, protect it
  if (!isPublicRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
  ],
}