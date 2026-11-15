import "server-only";
import { prisma } from "@lib/prisma";
import { serverEnv } from "@lib/env.server";
import { createAdminClient } from "@utils/supabase/admin";
import { UserRole } from "@interfaces/roles";

/**
 * Makes the site's first admin without touching the database by hand.
 *
 * When BOOTSTRAP_ADMIN_EMAIL is set and the signed-in user has *confirmed*
 * that exact email, they become ADMIN, but only while the site has no admin
 * at all. After that the setting does nothing, so it can't be used to take
 * over later; further roles are managed in Admin → Roles.
 *
 * Returns true when the user was just promoted (their session then needs a
 * refresh to carry the new role).
 */
export async function bootstrapFirstAdmin(userId: string): Promise<boolean> {
  const email = serverEnv().BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
  if (!email) return false;

  const rows = await prisma.$queryRaw<{ eligible: boolean }[]>`
    select
      exists (
        select 1 from auth.users
        where id = ${userId}::uuid and lower(email) = ${email} and email_confirmed_at is not null
      )
      and not exists (
        select 1 from auth.users where raw_app_meta_data->>'role' = 'ADMIN' and deleted_at is null
      ) as eligible`;
  if (!rows[0]?.eligible) return false;

  const { error } = await createAdminClient().auth.admin.updateUserById(userId, { app_metadata: { role: UserRole.ADMIN } });
  if (error) {
    console.error("Couldn't promote the bootstrap admin:", error.message);
    return false;
  }
  return true;
}
