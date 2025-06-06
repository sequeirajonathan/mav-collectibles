import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

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
  '/',         // Make home page public
  '/events(.*)', // Make events pages public
  '/category(.*)', // Make category pages public
  '/search(.*)', // Make search pages public
  '/cart(.*)', // Make cart pages public
  '/maintenance(.*)', // Make maintenance page public
])

export default clerkMiddleware(async (auth, req) => {
  const { sessionClaims } = await auth()
  const metadata = sessionClaims?.metadata as { role?: string }
  const isAdmin = metadata?.role === 'ADMIN'

  // If maintenance mode is enabled and the user is not an admin, redirect to maintenance page
  if (process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true' && !isAdmin) {
    const maintenanceUrl = new URL('/maintenance', req.url)
    return NextResponse.redirect(maintenanceUrl)
  }

  // If the request is for the maintenance page, allow it
  if (req.nextUrl.pathname.startsWith('/maintenance')) {
    return
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