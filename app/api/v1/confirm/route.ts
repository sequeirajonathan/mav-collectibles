import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest } from 'next/server'
import { createClient } from '@utils/supabase/server'
import { redirect } from 'next/navigation'
import { prisma } from '@lib/prisma'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/dashboard'

  if (token_hash && type) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })
    
    if (!error) {
      // Get the user after verification
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Create or update UserProfile in your database
        await prisma.userProfile.upsert({
          where: { email: user.email! },
          update: {
            lastLoginAt: new Date(),
            ...(user.user_metadata?.phoneNumber ? { phoneNumber: user.user_metadata.phoneNumber } : {}),
          },
          create: {
            email: user.email!,
            role: 'CUSTOMER',
            ...(user.user_metadata?.phoneNumber ? { phoneNumber: user.user_metadata.phoneNumber } : {}),
          },
        });

        // Redirect to dashboard with success message
        const url = new URL(next, request.url)
        url.searchParams.set('verified', 'true')
        return redirect(url.toString())
      }
    } else {
      // Handle specific error cases
      const url = new URL('/login', request.url)
      if (error.message.includes('expired')) {
        url.searchParams.set('error', 'token_expired')
        url.searchParams.set('message', 'Your verification link has expired. Please request a new one.')
      } else {
        url.searchParams.set('error', 'verification_failed')
        url.searchParams.set('message', 'Email verification failed. Please try again.')
      }
      return redirect(url.toString())
    }
  }

  // If no token or type provided
  const url = new URL('/login', request.url)
  url.searchParams.set('error', 'invalid_link')
  url.searchParams.set('message', 'Invalid verification link. Please try again.')
  return redirect(url.toString())
} 
