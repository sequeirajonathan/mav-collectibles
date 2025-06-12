import { useResource } from '@lib/swr';
import { toast } from 'react-hot-toast';

interface Installer {
  id: string;
  name: string;
  url: string;
  type: 'github_release';
  createdAt: string;
  updatedAt: string;
}

export function useInstallers() {
  const {
    data: installers,
    error,
    isLoading,
    remove,
    refresh,
  } = useResource<Installer[]>('/installers', {
    onError: (error) => {
      console.error('Failed to fetch installers:', error);
      if (error instanceof Error) {
        if (error.status === 404) {
          toast.error('No installers found');
        } else if (error.status === 500) {
          toast.error('Server error while loading installers');
        } else if (error.code === 'TIMEOUT') {
          toast.error('Request timed out while loading installers');
        } else if (error.code === 'NO_RESPONSE') {
          toast.error('Unable to connect to the server');
        } else if (error.code === 'INVALID_FORMAT') {
          toast.error('Invalid data format received from server');
        } else {
          toast.error(error.message || 'Failed to load installers');
        }
      } else {
        toast.error('Failed to load installers');
      }
    },
  });

  const handleDelete = async (id: string) => {
    try {
      await remove(id);
      await refresh();
      toast.success('Installer deleted successfully');
    } catch (error) {
      console.error('Error deleting installer:', error);
      if (error instanceof Error) {
        toast.error(error.message || 'Failed to delete installer');
      } else {
        toast.error('Failed to delete installer');
      }
      throw error;
    }
  };

  return {
    installers: Array.isArray(installers) ? installers : [],
    isLoading,
    error,
    deleteInstaller: handleDelete,
    refresh,
  };
} 