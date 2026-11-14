import { Suspense } from "react";
import { PageHeader } from "@components/hub/page-header";
import { RolesForm } from "@components/admin/roles-form";
import { requirePageRole } from "@lib/auth/guard";
import { UserRole } from "@interfaces/roles";

async function Form() {
  await requirePageRole([UserRole.ADMIN], "/admin/roles");
  return <RolesForm />;
}

export default function AdminRolesPage() {
  return (
    <>
      <PageHeader title="Roles" description="Give your team access to the admin tools." />
      <Suspense fallback={null}><Form /></Suspense>
    </>
  );
}
