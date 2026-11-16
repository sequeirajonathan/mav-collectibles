import "server-only";
import { prisma } from "@lib/prisma";
import { notifyRoles } from "@lib/push";
import { sendEmail } from "@lib/email";
import { siteUrl } from "@lib/seo";
import { alertStaff } from "@lib/discord/announce";
import { CONTENT_ROLES } from "@interfaces/roles";

/** Author of automatic Team chat messages (not a real account). */
export const SYSTEM_AUTHOR_ID = "00000000-0000-0000-0000-000000000000";
const SYSTEM_AUTHOR_NAME = "MAV site";

interface Finished {
  id: string;
  title: string;
  response: string;
  created_by: string;
  created_by_name: string;
}

/**
 * Tells the team about every finished request that hasn't been announced yet:
 * a Team chat message, a notification to staff devices, and an email to the
 * person who asked. Each request is claimed first, so it is announced once
 * even when two callers run at the same time. Returns how many went out.
 */
export async function sendRequestAlerts(): Promise<number> {
  const finished = await prisma.$queryRaw<Finished[]>`
    update public.staff_requests set notified_at = now()
    where status = 'done' and notified_at is null
    returning id, title, response, created_by, created_by_name`;
  for (const request of finished) {
    const reply = request.response.trim();
    try {
      await prisma.staffMessage.create({
        data: {
          author_id: SYSTEM_AUTHOR_ID,
          author_name: SYSTEM_AUTHOR_NAME,
          body: `✅ Request finished: “${request.title}” (asked by ${request.created_by_name}).${reply ? `\n${reply}` : ""}`.slice(0, 2000),
        },
      });
      await notifyRoles(CONTENT_ROLES, {
        title: "Request finished",
        body: `${request.title}${reply ? `: ${reply}` : ""}`.slice(0, 140),
        url: "/admin/requests?view=done",
        tag: `request-${request.id}`,
      });
      await alertStaff("Request finished", `${request.title} (asked by ${request.created_by_name})${reply ? `\n${reply}` : ""}`, "/admin/requests?view=done");
      const [asker] = await prisma.$queryRaw<{ email: string | null }[]>`select email from auth.users where id = ${request.created_by}::uuid`;
      if (asker?.email) {
        await sendEmail({
          to: asker.email,
          subject: `Done: ${request.title}`,
          text: [`Hi ${request.created_by_name},`, "", `Your request “${request.title}” is finished.`, ...(reply ? ["", reply] : []), "", `See it here: ${siteUrl()}/admin/requests?view=done`, "", "MAV Collectibles"].join("\n"),
        });
      }
    } catch (error) {
      // The request stays marked as announced: a half-sent alert is better than a repeated one.
      console.error("Request alert failed", request.id, error);
    }
  }
  return finished.length;
}
