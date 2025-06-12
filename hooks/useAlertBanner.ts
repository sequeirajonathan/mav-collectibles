import { AlertBanner } from '@validations/alert-banner';
import { alertBannerSchema } from '@validations/alert-banner';
import { useResource } from '@lib/swr';
import { useCallback } from 'react';
import { toast } from 'react-hot-toast';

export function useAlertBanner() {
  const {
    data: alertBanner,
    error,
    isLoading,
    create,
    update,
    refresh,
  } = useResource<AlertBanner>('/alert-banner', {
    onError: (error) => {
      console.error('Alert banner operation failed:', error);
      if (error instanceof Error) {
        if (error.status === 404) {
          toast.error('Alert banner not found');
        } else if (error.status === 500) {
          toast.error('Server error while loading alert banner');
        } else if (error.code === 'TIMEOUT') {
          toast.error('Request timed out while loading alert banner');
        } else if (error.code === 'NO_RESPONSE') {
          toast.error('Unable to connect to the server');
        } else if (error.code === 'INVALID_FORMAT') {
          toast.error('Invalid data format received from server');
        } else {
          toast.error(error.message || 'Failed to load alert banner');
        }
      } else {
        toast.error('Failed to load alert banner');
      }
    },
  });

  const handleUpdate = useCallback(async (id: string, data: Partial<AlertBanner>) => {
    if (!id) {
      throw new Error('Alert banner ID is required for update');
    }

    try {
      const validatedData = alertBannerSchema.partial().parse(data);
      const result = await update(id, validatedData);
      toast.success('Alert banner updated successfully');
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update alert banner');
      console.error('Error updating alert banner:', error);
      toast.error(error.message || 'Failed to update alert banner');
      throw error;
    }
  }, [update]);

  const handleCreate = useCallback(async (data: AlertBanner) => {
    try {
      const validatedData = alertBannerSchema.parse(data);
      const result = await create(validatedData);
      toast.success('Alert banner created successfully');
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create alert banner');
      console.error('Error creating alert banner:', error);
      toast.error(error.message || 'Failed to create alert banner');
      throw error;
    }
  }, [create]);

  return {
    alertBanner,
    isLoading,
    error,
    updateBanner: handleUpdate,
    createBanner: handleCreate,
    refresh,
  };
}

// Separate hook for updating alert banner
export function useUpdateAlertBanner() {
  const { updateBanner } = useAlertBanner();
  return updateBanner;
}