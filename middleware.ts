import { type NextRequest } from 'next/server'
import { updateSession } from '@utils/supabase/middleware'

// Debug logging function
const debug = (...args: any[]) => {
  if (process.env.NEXT_PUBLIC_DEBUG === 'true') {
    console.log(...args)
  }
}

export async function middleware(request: NextRequest) {
  debug('🔍 Root Middleware - Request path:', request.nextUrl.pathname)
  return await updateSession(request)
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