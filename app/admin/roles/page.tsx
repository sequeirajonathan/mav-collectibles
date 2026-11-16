import { Suspense } from "react";
import { PageHeader } from "@components/ui/page-header";
import { RolesForm } from "@components/admin/roles-form";
import { requirePageRole } from "@lib/auth/guard";
import { UserRole } from "@interfaces/roles";
import { listTeam, searchPeople } from "@lib/data/users";

async function Form() {
  await requirePageRole([UserRole.ADMIN], "/admin/roles");
  const [team, newest] = await Promise.all([listTeam(), searchPeople("")]);
  return <RolesForm team={team} newest={newest} />;
}

export default function AdminRolesPage() {
  return (
    <>
      <PageHeader title="Roles" description="Give your team access to the admin tools. Find a person by name instead of typing their email exactly." />
      <Suspense fallback={null}><Form /></Suspense>
    </>
  );
}
