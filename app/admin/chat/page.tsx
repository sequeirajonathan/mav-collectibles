import { Suspense } from "react";
import { PageHeader } from "@components/ui/page-header";
import { Skeleton } from "@components/ui/skeleton";
import { StaffChat } from "@components/admin/staff-chat";
import { PushToggle } from "@components/admin/push-toggle";
import { sendRequestAlerts } from "@lib/request-alerts";
import { requirePageRole } from "@lib/auth/guard";
import { CONTENT_ROLES, UserRole } from "@interfaces/roles";
import { listChatMessages } from "@lib/data/chat";

async function Chat() {
  const user = await requirePageRole(CONTENT_ROLES, "/admin/chat");
  // Requests finished outside this screen are announced the next time staff open Admin.
  await sendRequestAlerts().catch(() => 0);
  const messages = await listChatMessages();
  return <StaffChat initial={messages} userId={user.id} isAdmin={user.role === UserRole.ADMIN} />;
}

export default function AdminChatPage() {
  return (
    <>
      <PageHeader title="Team chat" description="A private channel for staff. Share updates, photos for review, and the occasional GIF. Customers never see it." actions={<PushToggle />} />
      <Suspense fallback={<Skeleton className="h-[60dvh]" />}>
        <Chat />
      </Suspense>
    </>
  );
}
