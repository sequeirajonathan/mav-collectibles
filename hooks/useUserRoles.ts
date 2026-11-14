import { useCallback, useState } from 'react';
import { UserRole } from '@interfaces/roles';
import { fetcherPost } from '@lib/swr';

interface UpdateRoleResponse {
  success: boolean;
  username: string;
  role: UserRole;
  error?: string;
}

export function useUserRoles() {
  const [isLoading, setIsLoading] = useState(false);

  /** `user` may be an email address, username or user id. */
  const updateUserRole = useCallback(async (user: string, role: UserRole): Promise<UpdateRoleResponse> => {
    setIsLoading(true);
    try {
      return await fetcherPost<UpdateRoleResponse, { user: string; role: UserRole }>('users/role', { user, role });
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { updateUserRole, isLoading };
}
