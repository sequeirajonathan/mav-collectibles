import { PrintAgentClient } from '@components/ui/PrintAgentClient';
import { getCurrentUser } from '@lib/auth/server';

export default async function PrintAgentPage() {
  // The proxy only lets print-capable roles reach this page.
  const user = await getCurrentUser();
  if (!user) return null;
  return <PrintAgentClient agentId={user.id} />;
}
