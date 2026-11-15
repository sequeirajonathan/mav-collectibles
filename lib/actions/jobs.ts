"use server";

import { prisma } from "@lib/prisma";
import { createAction } from "@lib/actions/safe-action";
import { HIRING_ROLES, UserRole } from "@interfaces/roles";
import { deleteApplicationInput, updateApplicationInput } from "@lib/contracts/jobs";
import { createAdminClient } from "@utils/supabase/admin";

/** Reviewers move an application along and keep private notes. */
export const updateJobApplication = createAction({ input: updateApplicationInput, access: HIRING_ROLES }, async ({ id, status, notes }) => {
  await prisma.jobApplication.update({ where: { id }, data: { status, notes } });
  return null;
});

/** Admins delete an application and its résumé for good. */
export const deleteJobApplication = createAction({ input: deleteApplicationInput, access: [UserRole.ADMIN] }, async ({ id }) => {
  const row = await prisma.jobApplication.findUnique({ where: { id }, select: { resume_path: true } });
  if (!row) return null;
  if (row.resume_path) await createAdminClient().storage.from("resumes").remove([row.resume_path]);
  await prisma.jobApplication.delete({ where: { id } });
  return null;
});
