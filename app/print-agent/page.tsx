import { PrintAgentClient } from '@components/ui/PrintAgentClient';
import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function PrintAgentPage() {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId || !user) {
    redirect('/print-agent/login');
  }

  // Check if user is a print agent
  const source = user.publicMetadata?.source as string;
  if (source !== 'print-agent') {
    redirect('/print-agent/login');
  }

  return <PrintAgentClient agentId={userId} />;
} 