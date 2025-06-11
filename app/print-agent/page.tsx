import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import PrintAgentClient from "@components/ui/PrintAgentClient";
import { UserProfile } from "@interfaces/userProfile";
import { UserRole } from "@interfaces/roles";

export default async function PrintAgentPage() {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId || !user) {
    redirect("/sign-in");
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
    publicMetadata: user.publicMetadata
  };

  return <PrintAgentClient user={userData} />;
} 