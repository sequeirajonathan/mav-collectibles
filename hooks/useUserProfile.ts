import { useResource } from '@lib/swr';
import { UserProfile } from '@interfaces';
import { toast } from 'react-hot-toast';

export function useUserProfile() {
  return useResource<UserProfile>('/user-profile', {
    onError: (error) => {
      console.error('Failed to fetch user profile:', error);
      toast.error('Failed to load user profile');
    }
  });
} 