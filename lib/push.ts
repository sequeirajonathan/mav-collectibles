import "server-only";
import webpush from "web-push";
import { prisma } from "@lib/prisma";
import { serverEnv } from "@lib/env.server";
import type { UserRole } from "@interfaces/roles";

interface Notice {
  title: string;
  body: string;
  /** Path to open when the notification is tapped. */
  url: string;
  /** Notifications with the same tag replace each other. */
  tag?: string;
}

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

/**
 * Sends a push notification to every browser registered by users who hold one
 * of `roles` right now (minus `exceptUserId`). Best-effort: returns quietly
 * when push isn't configured, and forgets subscriptions the browser has dropped.
 */
export async function notifyRoles(roles: readonly UserRole[], notice: Notice, exceptUserId?: string): Promise<void> {
  const privateKey = serverEnv().VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return;
  try {
    const subscriptions = await prisma.$queryRaw<{ id: string; endpoint: string; p256dh: string; auth: string }[]>`
      select s.id, s.endpoint, s.p256dh, s.auth
      from public.push_subscriptions s
      join auth.users u on u.id = s.user_id
      where u.raw_app_meta_data->>'role' = any(${[...roles]}::text[])
        and (${exceptUserId ?? null}::uuid is null or s.user_id <> ${exceptUserId ?? null}::uuid)`;
    if (subscriptions.length === 0) return;
    const payload = JSON.stringify(notice);
    const options = { vapidDetails: { subject: "mailto:info@mavcollectibles.com", publicKey, privateKey }, TTL: 3600 };
    const gone: string[] = [];
    await Promise.all(
      subscriptions.map(async (s) => {
        try {
          await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, options);
        } catch (error) {
          const status = error instanceof webpush.WebPushError ? error.statusCode : 0;
          if (status === 404 || status === 410) gone.push(s.id);
          else console.error("Push failed", status || error);
        }
      })
    );
    if (gone.length) await prisma.pushSubscription.deleteMany({ where: { id: { in: gone } } });
  } catch (error) {
    console.error("Push failed", error);
  }
}
