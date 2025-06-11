import { useCallback } from 'react';
import { UserRole } from '@interfaces/roles';
import { useResource } from '@lib/swr';

interface UpdateUserRoleResponse {
  success: boolean;
  username: string;
  role: UserRole;
  error?: string;
}

interface UpdateUserRoleRequest {
  userId: string;
  role: UserRole;
}

export function useUserRoles() {
  const { create } = useResource<UpdateUserRoleResponse, UpdateUserRoleRequest>('user/metadata');

  const updateUserRole = useCallback(async (userId: string, role: UserRole): Promise<UpdateUserRoleResponse> => {
    try {
      const data = await create({ userId, role });
      return data;
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  }, [create]);

  return { updateUserRole, isLoading: false };
} 