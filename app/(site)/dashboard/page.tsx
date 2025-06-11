import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import DashboardClient from "@components/ui/DashboardClient";
import { UserProfile } from "@interfaces/userProfile";
import { UserRole } from "@interfaces/roles";

export default async function DashboardPage() {
  const { userId } = await auth();
  const user = await currentUser();
  
  console.log('Raw User Data from Backend:', {
    userId,
    user,
    publicMetadata: user?.publicMetadata
  });

  if (!userId || !user) {
    redirect("/sign-in");
  }

  const source = (user.publicMetadata?.source as string) || '';
  if (source === 'print-agent') {
    redirect('/print-agent');
  }

  const phoneNumber = user.phoneNumbers[0]?.phoneNumber?.replace(/^\+1/, '') || '';

  const userData: UserProfile = {
    id: user.id,
    email: user.emailAddresses[0]?.emailAddress || '',
    role: (user.publicMetadata?.role as UserRole) || UserRole.USER,
    createdAt: new Date(Number(user.createdAt)).toISOString(),
    lastSignInAt: user.lastSignInAt ? new Date(Number(user.lastSignInAt)).toISOString() : undefined,
    phoneNumber,
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    source: (user.publicMetadata?.source as string) || '',
  };

  console.log('Constructed User Data:', userData);

  return <DashboardClient user={userData} />;
} 