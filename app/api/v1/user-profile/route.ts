import { NextResponse } from 'next/server'
import { createClient } from '@utils/supabase/server'
import { prisma } from '@lib/prisma'
import { parseRole } from '@interfaces/roles'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data } = await supabase.auth.getUser()
    const user = data.user
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const profile = await prisma.profile.findUnique({ where: { id: user.id } })

    return NextResponse.json({
      email: user.email,
      role: parseRole(user.app_metadata?.role),
      username: profile?.username ?? null,
      firstName: profile?.first_name ?? null,
      lastName: profile?.last_name ?? null,
      phoneNumber: profile?.phone ?? null,
      emailVerified: Boolean(user.email_confirmed_at),
      lastLoginAt: user.last_sign_in_at,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    })
  } catch (error) {
    console.error('Error in user-profile route:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
