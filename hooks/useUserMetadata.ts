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
  role: UserRole;
}

export function useUserMetadata() {
  const { data, error, mutate } = useSWR<UserMetadataResponse>(
    'user/metadata',
    (url: string) => fetcherPost<UserMetadataResponse, UserMetadataRequest>(url, { role: UserRole.USER })
  );

  const setUserRole = useCallback(async (role: UserRole): Promise<UserMetadataResponse> => {
    try {
      const response = await fetcherPost<UserMetadataResponse, UserMetadataRequest>('user/metadata', { role });
      await mutate();
      return response;
    } catch (error) {
      console.error('Error setting user role:', error);
      throw error;
    }
  }, [mutate]);

  return {
    setUserRole,
    data,
    error
  };
} 