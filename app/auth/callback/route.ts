import { createClient } from '@lib/supabase/server'
import { NextResponse } from 'next/server'
import { prisma } from '@lib/prisma'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (authError) {
      console.error('Auth error:', authError);
      return NextResponse.redirect(new URL('/login?error=auth', requestUrl.origin));
    }

    if (user) {
      try {
        // Create or update UserProfile with ADMIN role for your email
        const userProfile = await prisma.userProfile.upsert({
          where: { email: user.email! },
          update: {
            lastLoginAt: new Date(),
          },
          create: {
            email: user.email!,
            role: user.email === 'sequeira.s.jonathan@gmail.com' ? 'ADMIN' : 'CUSTOMER',
          },
        });

        // Also update the Supabase user_profiles table to match Prisma
        const { error: supabaseError } = await supabase
          .from('user_profiles')
          .upsert({
            email: user.email,
            role: userProfile.role,
            created_at: userProfile.createdAt,
            updated_at: userProfile.updatedAt,
          });

        if (supabaseError) {
          console.error('Error syncing with Supabase:', supabaseError);
        }
      } catch (error) {
        console.error('Error in profile creation:', error);
      }
    }
  }

  // Get the redirectTo parameter or default to dashboard
  const redirectTo = requestUrl.searchParams.get('redirectTo') || '/dashboard';
  return NextResponse.redirect(new URL(redirectTo, requestUrl.origin));
} 