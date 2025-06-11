import { useCallback } from 'react';
import { UserRole } from '@interfaces/roles';
import { useResource } from '@lib/swr';

interface SetUserMetadataResponse {
  success: boolean;
  username: string;
  role: UserRole;
  error?: string;
}

interface SetUserMetadataRequest {
  role: UserRole;
}

export function useUserMetadata() {
  const { create } = useResource<SetUserMetadataResponse, SetUserMetadataRequest>('user/metadata');

  const setUserRole = useCallback(async (role: UserRole): Promise<SetUserMetadataResponse> => {
    try {
      const data = await create({ role });
      return data;
    } catch (error) {
      console.error('Error setting user role:', error);
      throw error;
    }
  }, [create]);

  return {
    setUserRole,
  };
} 