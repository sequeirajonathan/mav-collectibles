import { Suspense } from "react";
import { PrintAgentClient } from "@components/ui/PrintAgentClient";
import { getCurrentUser } from "@lib/auth/server";

async function Agent() {
  // The proxy only lets print-capable roles reach this page.
  const user = await getCurrentUser();
  return user ? <PrintAgentClient agentId={user.id} /> : null;
}

export default function PrintAgentPage() {
  return (
    <Suspense fallback={<p className="py-8 text-center text-muted-foreground">Loading…</p>}>
      <Agent />
    </Suspense>
  );
}
