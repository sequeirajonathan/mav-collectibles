import { createClient } from '@utils/supabase/server'
import { NextResponse } from 'next/server'
import { prisma } from '@lib/prisma'

export async function GET(request: Request) {
  try {
    // Get the Authorization header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid Authorization header' },
        { status: 401 }
      )
    }

    // Extract the token
    const token = authHeader.split(' ')[1]
    if (!token) {
      return NextResponse.json(
        { error: 'Missing token' },
        { status: 401 }
      )
    }

    // Create Supabase client with the token
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      console.error('Error getting user:', userError)
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    // Get user profile
    const userProfile = await prisma.userProfile.findUnique({
      where: { email: user.email! },
    })

    // Check if user is admin/staff/manager/owner
    const isAdmin = userProfile?.role === 'ADMIN' || 
                   userProfile?.role === 'STAFF' || 
                   userProfile?.role === 'MANAGER' || 
                   userProfile?.role === 'OWNER';

    // If maintenance mode is enabled and user is not admin, return 503
    if (process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true' && !isAdmin) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable' },
        { status: 503 }
      )
    }

    if (!userProfile) {
      // If profile doesn't exist, create one
      const newProfile = await prisma.userProfile.create({
        data: {
          email: user.email!,
          role: 'CUSTOMER',
          ...(user.user_metadata?.phoneNumber ? { phoneNumber: user.user_metadata.phoneNumber } : {}),
        },
      })
      return NextResponse.json(newProfile)
    }

    return NextResponse.json(userProfile)
  } catch (error) {
    console.error('Error in user-profile route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 