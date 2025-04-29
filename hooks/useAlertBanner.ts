import { useState, useEffect } from 'react';
import { AlertBanner } from '@validations/alert-banner';
import { alertBannerSchema } from '@validations/alert-banner';
import { fetchAlertBanner, updateAlertBanner, createAlertBanner } from '@services/alertBannerService';

export function useAlertBanner() {
  const [alertBanner, setAlertBanner] = useState<AlertBanner | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    loadAlertBanner();
  }, []);

  const loadAlertBanner = async () => {
    try {
      setLoading(true);
      const banner = await fetchAlertBanner();
      setAlertBanner(banner);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load alert banner'));
    } finally {
      setLoading(false);
    }
  };

  const updateBanner = async (id: string, data: Partial<AlertBanner>) => {
    try {
      setLoading(true);
      const validatedData = alertBannerSchema.partial().parse(data);
      const updatedBanner = await updateAlertBanner(id, validatedData);
      setAlertBanner(updatedBanner);
      return updatedBanner;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update alert banner');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const createBanner = async (data: AlertBanner) => {
    try {
      setLoading(true);
      const validatedData = alertBannerSchema.parse(data);
      const newBanner = await createAlertBanner(validatedData);
      setAlertBanner(newBanner);
      return newBanner;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create alert banner');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    alertBanner,
    loading,
    error,
    updateBanner,
    createBanner,
    refresh: loadAlertBanner,
  };
}

// Separate hook for updating alert banner
export function useUpdateAlertBanner() {
  const { updateBanner } = useAlertBanner();
  return updateBanner;
}

// Separate hook for creating alert banner
export function useCreateAlertBanner() {
  const { createBanner } = useAlertBanner();
  return createBanner;
}
