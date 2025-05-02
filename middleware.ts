import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@lib/supabase/middleware';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  // First, update the session using Supabase
  const response = await updateSession(request);
  
  // If we got a response from updateSession, use that as the base
  // Otherwise, create a new response
  const finalResponse = response || NextResponse.next();
  
  // Add CORS headers
  finalResponse.headers.set('Access-Control-Allow-Origin', '*');
  finalResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  finalResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Check if the request is for a public route
  const url = request.nextUrl.clone();
  const isPublicRoute = 
    url.pathname.startsWith('/login') || 
    url.pathname.startsWith('/signup') ||
    url.pathname.startsWith('/auth') ||
    url.pathname.startsWith('/products') ||
    url.pathname === '/';
  
  // If it's an API route, just return the response with CORS headers
  if (url.pathname.startsWith('/api')) {
    return finalResponse;
  }
  
  // For non-public routes, check if we have a user
  if (!isPublicRoute) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll() {
            // We don't need to set cookies here
          },
        },
      }
    );
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      // No user, redirect to login with the original URL as redirectTo
      url.pathname = '/login';
      url.searchParams.set('redirectTo', request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }
  }
  
  return finalResponse;
}

export const config = {
  matcher: [
    // Match API routes for CORS
    '/api/:path*',
    // Match all request paths except for the ones starting with:
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - favicon.ico (favicon file)
    // And except for image files
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}; 