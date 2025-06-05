import { AlertBanner } from '@validations/alert-banner';
import { alertBannerSchema } from '@validations/alert-banner';
import { useResource } from '@lib/swr';
import { useCallback } from 'react';

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
    },
  });

  const handleUpdate = useCallback(async (id: string, data: Partial<AlertBanner>) => {
    if (!id) {
      throw new Error('Alert banner ID is required for update');
    }

    try {
      const validatedData = alertBannerSchema.partial().parse(data);
      return await update(id, validatedData);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update alert banner');
      throw error;
    }
  }, [update]);

  const handleCreate = useCallback(async (data: AlertBanner) => {
    try {
      const validatedData = alertBannerSchema.parse(data);
      return await create(validatedData);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create alert banner');
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