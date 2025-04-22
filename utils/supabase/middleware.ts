import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  console.log('updateSession running for path:', request.nextUrl.pathname);
  
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

  await supabase.auth.getSession()
  return supabaseResponse
}