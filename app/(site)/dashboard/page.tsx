import { createClient } from '@lib/supabase/server'
import { redirect } from 'next/navigation'
import { prisma } from '@lib/prisma'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get the user's profile from our database
  const userProfile = await prisma.userProfile.findUnique({
    where: { email: user.email! },
  })

  return <DashboardClient user={user} userProfile={userProfile} />
} 