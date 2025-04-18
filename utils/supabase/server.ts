import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Debug log to check environment variables
console.log('ENV CHECK:', {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'defined' : 'undefined',
  key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'defined' : 'undefined'
})

// Fallback values if environment variables are not available
const FALLBACK_SUPABASE_URL = 'https://xuktdxadhwvdpmzscvgg.supabase.co'
const FALLBACK_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1a3RkeGFkaHd2ZHBtenNjdmdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ1ODYyMTcsImV4cCI6MjA2MDE2MjIxN30.OX7_vI_m3V1j_YobAyycZKN03BQEr9HzEEDlIP399vI'

export async function createClient() {
  const cookieStore = await cookies()
  
  // Use environment variables with fallbacks
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_SUPABASE_KEY
  
  return createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
} 