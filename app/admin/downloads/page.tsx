import { Suspense } from "react";
import { PageHeader } from "@components/ui/page-header";
import { Installers } from "@components/admin/installers";
import { requirePageRole } from "@lib/auth/guard";
import { UserRole } from "@interfaces/roles";
import { listInstallers } from "@lib/data/site";

async function List() {
  await requirePageRole([UserRole.ADMIN], "/admin/downloads");
  return <Installers installers={await listInstallers()} />;
}

export default function AdminDownloadsPage() {
  return (
    <>
      <PageHeader title="Print agent downloads" />
      <Suspense fallback={null}><List /></Suspense>
    </>
  );
}
