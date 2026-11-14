import { Suspense } from "react";
import { PrintAgentClient } from "@components/ui/PrintAgentClient";
import { redirect } from "next/navigation";
import { getUserWithRole } from "@lib/auth/server";
import { PRINT_ROLES } from "@interfaces/roles";

async function Agent() {
  // The proxy checks the token's role; this checks the role as stored now.
  const { user, allowed } = await getUserWithRole(PRINT_ROLES);
  if (!allowed || !user) redirect("/print-agent/login?error=not_print_agent");
  return <PrintAgentClient agentId={user.id} />;
}

export default function PrintAgentPage() {
  return (
    <Suspense fallback={<p className="py-8 text-center text-muted-foreground">Loading…</p>}>
      <Agent />
    </Suspense>
  );
}
