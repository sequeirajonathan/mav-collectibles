import { useCallback } from 'react';
import { useResource } from '@lib/swr';
import { UserRole } from '@interfaces/roles';

interface SetUserMetadataResponse {
  success: boolean;
  error?: string;
}

export function useUserMetadata() {
  const setUserRole = useCallback(async (role: UserRole): Promise<SetUserMetadataResponse> => {
    try {
      const response = await fetch('/api/v1/user/metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update user role');
      }

      return { success: true };
    } catch (error) {
      console.error('Error setting user role:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update user role' 
      };
    }
  }, []);

  return {
    setUserRole,
  };
} 