import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { updateSession } from '@/utils/supabase/middleware';

export async function middleware(request: NextRequest) {
  const res = await updateSession(request);
  
  // Check auth condition for protected routes
  const { pathname } = request.nextUrl;
  const protectedPaths = ['/profile', '/orders'];
  const isProtectedRoute = protectedPaths.some(path => pathname.startsWith(path));

  if (isProtectedRoute) {
    // Instead of creating a new client here, we'll use the response from updateSession
    // which already has the user session information
    
    // Extract the user from the response headers
    const authHeader = request.headers.get('x-supabase-auth');
    if (!authHeader || authHeader === 'null') {
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('redirectedFrom', pathname);
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Fix: Use request.cookies directly instead of cookieStore
  const authCookie = request.cookies.get('auth-token');
  
  // Your middleware logic here
  // For example, redirecting unauthenticated users
  if (!authCookie && request.nextUrl.pathname.startsWith('/profile')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return res;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    '/profile/:path*',
    '/cart/:path*',
  ],
}; 