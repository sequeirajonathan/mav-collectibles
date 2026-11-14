/**
 * Roles are stored in Supabase `app_metadata.role` (writable only with the
 * secret key) and carried in every access token. A missing role means USER.
 */
export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  STAFF = 'STAFF',
  EVENT = 'EVENT',
  PRINT_AGENT = 'PRINT_AGENT',
}

export type UserRoleType = `${UserRole}`;

const ROLE_VALUES = new Set<string>(Object.values(UserRole));

export const parseRole = (value: unknown): UserRole =>
  typeof value === 'string' && ROLE_VALUES.has(value) ? (value as UserRole) : UserRole.USER;

/** Roles that can open the admin dashboard. */
export const ADMIN_PANEL_ROLES: readonly UserRole[] = [UserRole.ADMIN, UserRole.STAFF, UserRole.EVENT];

/** Roles that can see and process print jobs. */
export const PRINT_ROLES: readonly UserRole[] = [UserRole.ADMIN, UserRole.STAFF, UserRole.PRINT_AGENT];
