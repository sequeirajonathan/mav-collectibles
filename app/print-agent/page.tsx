import { PrintAgentClient } from '@components/ui/PrintAgentClient';
import { auth, currentUser } from '@clerk/nextjs/server';

export default async function PrintAgentPage() {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId || !user) {
    return null; // Middleware will handle the redirect
  }

  return <PrintAgentClient agentId={userId} />;
} 