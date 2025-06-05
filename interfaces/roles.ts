export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  STAFF = 'STAFF',
  EVENT = 'EVENT'
}

export type UserRoleType = `${UserRole}`;

export const isAdminRole = (role: string): boolean => {
  return role === UserRole.ADMIN || 
         role === UserRole.STAFF || 
         role === UserRole.EVENT;
}; 