import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  // This function might be redirecting users away from the signup page
  // Let's modify it to respect public routes
  
  // Get the pathname from the request URL
  const pathname = request.nextUrl.pathname
  
  // Define public routes that should not redirect
  const isPublicRoute = 
    pathname.startsWith('/login') || 
    pathname.startsWith('/signup') ||
    pathname.startsWith('/auth') ||
    pathname === '/'
    
  // If it's a public route, don't redirect
  if (isPublicRoute) {
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    })
  }
  
  // Original Supabase session update logic for protected routes
  const supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value
        },
        set(name, value, options) {
          supabaseResponse.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name, options) {
          supabaseResponse.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  try {
    await supabase.auth.getSession()
  } catch (error) {
    // If there's an error getting the session (like invalid refresh token),
    // clear the session and redirect to login
    if (error instanceof Error && 'code' in error && error.code === 'refresh_token_not_found') {
      // Clear any existing auth cookies
      supabaseResponse.cookies.set({
        name: 'sb-access-token',
        value: '',
        path: '/',
        maxAge: 0,
      })
      supabaseResponse.cookies.set({
        name: 'sb-refresh-token',
        value: '',
        path: '/',
        maxAge: 0,
      })
      
      // Redirect to login if not already on a public route
      if (!isPublicRoute) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        url.searchParams.set('redirectTo', request.nextUrl.pathname)
        return NextResponse.redirect(url)
      }
    }
  }
  
  return supabaseResponse
}