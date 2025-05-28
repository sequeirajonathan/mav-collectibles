import { createClient } from '@utils/supabase/server'
import { NextResponse } from 'next/server'
import { prisma } from '@lib/prisma'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()

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
          })

          // Update user metadata with role - this is crucial for middleware
          const { error: updateError } = await supabase.auth.updateUser({
            data: {
              role: userProfile.role,
              phoneNumber: userProfile.phoneNumber,
            }
          })

          if (updateError) {
            console.error('Error updating user metadata:', updateError)
          }

          // Also update the Supabase user_profiles table to match Prisma
          const { error: supabaseError } = await supabase
            .from('user_profiles')
            .upsert({
              email: user.email,
              role: userProfile.role,
              created_at: userProfile.createdAt,
              updated_at: userProfile.updatedAt,
            })

          if (supabaseError) {
            console.error('Error syncing with Supabase:', supabaseError)
          }

          // Force a session refresh to ensure new metadata is available
          const { data: { session }, error: refreshError } = await supabase.auth.refreshSession()
          
          if (refreshError) {
            console.error('Error refreshing session:', refreshError)
          } else {
            console.log('Session refreshed with metadata:', session?.user?.user_metadata)
          }

          // Double-check the user metadata was updated
          const { data: { user: updatedUser } } = await supabase.auth.getUser()
          console.log('Updated user metadata:', updatedUser?.user_metadata)

          // Redirect to dashboard after successful authentication
          return NextResponse.redirect(new URL('/dashboard', request.url))
        } catch (error) {
          console.error('Error in profile creation:', error)
        }
      }
    }
  }

  // If we get here, something went wrong
  return NextResponse.redirect(new URL('/error', request.url))
} 