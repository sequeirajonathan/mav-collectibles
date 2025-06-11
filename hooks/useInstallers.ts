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
      toast.error('Failed to load installers');
    },
  });

  const handleDelete = async (id: string) => {
    try {
      await remove(id);
      await refresh();
      toast.success('Installer deleted successfully');
    } catch (error) {
      console.error('Error deleting installer:', error);
      toast.error('Failed to delete installer');
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