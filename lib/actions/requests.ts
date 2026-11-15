"use server";

import { prisma } from "@lib/prisma";
import { ActionError, createAction } from "@lib/actions/safe-action";
import { CONTENT_ROLES, UserRole } from "@interfaces/roles";
import { deleteRequestInput, submitRequestInput, updateRequestInput } from "@lib/contracts/requests";

/** Staff ask for a feature or report a problem. */
export const submitStaffRequest = createAction({ input: submitRequestInput, access: CONTENT_ROLES }, async ({ kind, title, details, page, urgent }, user) => {
  const profile = await prisma.profile.findUnique({ where: { id: user.id }, select: { username: true, first_name: true, last_name: true } });
  const name = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || profile?.username || user.email || "Staff";
  const row = await prisma.staffRequest.create({
    data: { kind, title, details, page: page ?? null, priority: urgent ? "high" : "normal", created_by: user.id, created_by_name: name },
    select: { id: true },
  });
  return { id: row.id };
});

/** Admins move a request along and reply to it. */
export const updateStaffRequest = createAction({ input: updateRequestInput, access: [UserRole.ADMIN] }, async ({ id, status, priority, response }) => {
  const current = await prisma.staffRequest.findUnique({ where: { id }, select: { status: true, completed_at: true } });
  if (!current) throw new ActionError("That request no longer exists.");
  const completedAt = status === "done" ? (current.status === "done" ? current.completed_at : new Date()) : null;
  await prisma.staffRequest.update({ where: { id }, data: { status, priority, response, completed_at: completedAt } });
  return null;
});

/** Remove a request: admins any time, the person who asked while it is still new. */
export const deleteStaffRequest = createAction({ input: deleteRequestInput, access: CONTENT_ROLES }, async ({ id }, user) => {
  const row = await prisma.staffRequest.findUnique({ where: { id }, select: { created_by: true, status: true } });
  if (!row) return null;
  const own = row.created_by === user.id && row.status === "new";
  if (user.role !== UserRole.ADMIN && !own) throw new ActionError("Only an admin can remove a request once work has started.");
  await prisma.staffRequest.delete({ where: { id } });
  return null;
});
