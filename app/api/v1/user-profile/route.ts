import { NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { UserRole, isAdminRole } from '@interfaces/roles'

export async function GET(_request: Request) {
  try {
    const user = await currentUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin/staff/event
    const role = (user.publicMetadata.role as string) || UserRole.USER
    const isAdmin = isAdminRole(role)

    // If maintenance mode is enabled and user is not admin, return 503
    if (process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true' && !isAdmin) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable' },
        { status: 503 }
      )
    }

    return NextResponse.json({
      email: user.emailAddresses[0].emailAddress,
      role: role,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumbers[0]?.phoneNumber,
      emailVerified: user.emailAddresses[0]?.verification?.status === 'verified',
      phoneVerified: user.phoneNumbers[0]?.verification?.status === 'verified',
      lastLoginAt: user.lastSignInAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    })
  } catch (error) {
    console.error('Error in user-profile route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 