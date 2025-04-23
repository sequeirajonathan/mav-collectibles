import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const userProfile = await prisma.userProfile.findUnique({
      where: { email: user.email! },
    })

    if (!userProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    return NextResponse.json(userProfile)
  } catch (error) {
    console.error('Error in user-profile route:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 