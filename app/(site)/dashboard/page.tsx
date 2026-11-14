import { redirect } from "next/navigation";
import DashboardClient from "@components/ui/DashboardClient";
import { UserProfile } from "@interfaces/userProfile";
import { parseRole, UserRole } from "@interfaces/roles";
import { createClient } from "@utils/supabase/server";
import { prisma } from "@lib/prisma";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) redirect("/sign-in?next=/dashboard");

  const role = parseRole(user.app_metadata?.role);
  if (role === UserRole.PRINT_AGENT) redirect("/print-agent");

  const profile = await prisma.profile.findUnique({ where: { id: user.id } });

  const userData: UserProfile = {
    id: user.id,
    email: user.email ?? "",
    role,
    createdAt: user.created_at,
    lastSignInAt: user.last_sign_in_at ?? undefined,
    phoneNumber: profile?.phone?.replace(/^\+1/, "") ?? "",
    firstName: profile?.first_name ?? "",
    lastName: profile?.last_name ?? "",
  };

  return <DashboardClient user={userData} />;
}
