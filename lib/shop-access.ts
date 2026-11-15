import "server-only";
import { getFlags } from "@lib/data/site";
import { getUserWithRole } from "@lib/auth/server";
import { HIRING_ROLES } from "@interfaces/roles";

/** Admins and staff can always preview the shop. */
const SHOP_PREVIEW_ROLES = HIRING_ROLES;

/** Whether the person making this request may see shop pages and catalog data. */
export async function canSeeShop(): Promise<boolean> {
  if ((await getFlags()).shopVisible) return true;
  return (await getUserWithRole(SHOP_PREVIEW_ROLES)).allowed;
}
