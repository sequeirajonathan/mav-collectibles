import { PrintAgentClient } from '@components/ui/PrintAgentClient';
import { auth } from '@clerk/nextjs/server';

export default async function PrintAgentPage() {
  const { userId } = await auth();
  
  if (!userId) {
    return null;
  }

  return <PrintAgentClient agentId={userId} />;
} 