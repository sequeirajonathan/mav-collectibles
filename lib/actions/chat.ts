"use server";

import { prisma } from "@lib/prisma";
import { ActionError, createAction } from "@lib/actions/safe-action";
import { CONTENT_ROLES, UserRole } from "@interfaces/roles";
import { deleteMessageInput, pushSubscriptionInput, removeSubscriptionInput, sendMessageInput } from "@lib/contracts/chat";
import { createAdminClient } from "@utils/supabase/admin";
import { notifyRoles } from "@lib/push";

export const sendStaffMessage = createAction({ input: sendMessageInput, access: CONTENT_ROLES }, async ({ body, imagePath }, user) => {
  const profile = await prisma.profile.findUnique({ where: { id: user.id }, select: { username: true, first_name: true, last_name: true } });
  const name = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || profile?.username || "Staff";
  const row = await prisma.staffMessage.create({
    data: { author_id: user.id, author_name: name, body, image_path: imagePath ?? null },
    select: { id: true },
  });
  await notifyRoles(
    CONTENT_ROLES,
    { title: name, body: body ? body.slice(0, 140) : "Sent a picture", url: "/admin/chat", tag: "staff-chat" },
    user.id
  );
  return { id: row.id };
});

/** Remove a message: your own, or any message if you're an admin. */
export const deleteStaffMessage = createAction({ input: deleteMessageInput, access: CONTENT_ROLES }, async ({ id }, user) => {
  const row = await prisma.staffMessage.findUnique({ where: { id }, select: { author_id: true, image_path: true } });
  if (!row) return null;
  if (row.author_id !== user.id && user.role !== UserRole.ADMIN) throw new ActionError("You can only delete your own messages.");
  if (row.image_path) await createAdminClient().storage.from("staff-chat").remove([row.image_path]);
  await prisma.staffMessage.delete({ where: { id } });
  return null;
});

/** Remember this browser so the signed-in staff member gets notifications on it. */
export const savePushSubscription = createAction({ input: pushSubscriptionInput, access: CONTENT_ROLES }, async ({ endpoint, keys }, user) => {
  await prisma.pushSubscription.upsert({
    where: { endpoint },
    create: { user_id: user.id, endpoint, p256dh: keys.p256dh, auth: keys.auth },
    update: { user_id: user.id, p256dh: keys.p256dh, auth: keys.auth },
  });
  return null;
});

export const removePushSubscription = createAction({ input: removeSubscriptionInput, access: "user" }, async ({ endpoint }, user) => {
  await prisma.pushSubscription.deleteMany({ where: { endpoint, user_id: user.id } });
  return null;
});
