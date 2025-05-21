import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest } from 'next/server'
import { createClient } from '@lib/supabase/server'
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
      // Create or update UserProfile after successful verification
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
      }
      
      redirect(next)
    }
  }

  // redirect the user to an error page with some instructions
  redirect('/error')
} 