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
      // Detect OTP expired or invalid
      if (
        authError.message?.includes('expired') ||
        authError.message?.includes('invalid') ||
        authError.message?.includes('OTP')
      ) {
        // Try to get the email from the query or session
        const email = requestUrl.searchParams.get('email') || '';
        const retryUrl = new URL('/login', requestUrl.origin);
        retryUrl.searchParams.set('message', 'Your confirmation link is invalid or expired. Please try again or resend the confirmation email.');
        if (email) retryUrl.searchParams.set('retryEmail', email);
        return NextResponse.redirect(retryUrl);
      }
      // Other auth errors
      return NextResponse.redirect(new URL('/login?error=auth', requestUrl.origin));
    }

    if (user) {
      try {
        // Create or update UserProfile
        const userProfile = await prisma.userProfile.upsert({
          where: { email: user.email! },
          update: {
            lastLoginAt: new Date(),
            ...(user.user_metadata?.phoneNumber ? { phoneNumber: user.user_metadata.phoneNumber } : {}),
          },
          create: {
            email: user.email!,
            role: 'CUSTOMER', // Default role
            ...(user.user_metadata?.phoneNumber ? { phoneNumber: user.user_metadata.phoneNumber } : {}),
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