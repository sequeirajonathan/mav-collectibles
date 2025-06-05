import { useCallback } from 'react';
import { UserRole } from '@interfaces/roles';

export function useUserRoles() {
  const updateUserRole = useCallback(async (userId: string, role: UserRole): Promise<any> => {
    try {
      const response = await fetch('/api/v1/user/metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role }),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error updating user role:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }, []);

  return { updateUserRole, isLoading: false };
} 