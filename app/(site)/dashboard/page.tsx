import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import DashboardClient from './DashboardClient';
import { ClerkUser, UserProfile } from '@interfaces/userProfile';
import { UserRole } from '@interfaces/roles';

export default async function DashboardPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/sign-in');
  }

  const user = await currentUser();
  if (!user) {
    redirect('/sign-in');
  }

  const userData: UserProfile = {
    id: user.id,
    email: user.emailAddresses[0]?.emailAddress,
    role: (user.publicMetadata.role as UserRole) || UserRole.USER,
    createdAt: user.createdAt,
    lastSignInAt: user.lastSignInAt || undefined,
    firstName: user.firstName || undefined,
    lastName: user.lastName || undefined,
    imageUrl: user.imageUrl,
  };

  return <DashboardClient user={userData} />;
} 