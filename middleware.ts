import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

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