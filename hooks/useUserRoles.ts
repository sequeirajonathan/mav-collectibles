import { useCallback } from 'react';
import { UserRole } from '@interfaces/roles';
import { fetcherPost } from '@lib/swr';
import useSWR from 'swr';

interface UserMetadataResponse {
  success: boolean;
  username: string;
  role: UserRole;
  error?: string;
}

interface UserMetadataRequest {
  userId: string;
  role: UserRole;
}

export function useUserRoles() {
  const { mutate } = useSWR<UserMetadataResponse>('user/metadata');

  const updateUserRole = useCallback(async (userId: string, role: UserRole): Promise<UserMetadataResponse> => {
    try {
      const response = await fetcherPost<UserMetadataResponse, UserMetadataRequest>('user/metadata', { userId, role });
      await mutate();
      return response;
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  }, [mutate]);

  return { updateUserRole, isLoading: false };
} 