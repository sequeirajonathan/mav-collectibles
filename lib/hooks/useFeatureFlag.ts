import { useState, useEffect } from 'react';
import axios from 'axios';

type FeatureFlag = {
  id: string;
  name: string;
  enabled: boolean;
};

export function useFeatureFlag(flagName: string) {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchFeatureFlag = async () => {
      try {
        const response = await axios.get<FeatureFlag[]>('/api/feature-flags');
        const flags = response.data;
        const flag = flags.find((f) => f.name === flagName);
        setEnabled(flag?.enabled || false);
      } catch {
        setError('Failed to fetch feature flag');
      } finally {
        setLoading(false);
      }
    };

    fetchFeatureFlag();
  }, [flagName]);

  const toggleFlag = async (flagId: string, isEnabled: boolean): Promise<void> => {
    setIsLoading(true);
    try {
      await axios.patch(`/api/feature-flags/${flagId}`, { enabled: isEnabled });
      setEnabled(isEnabled);
    } catch (error) {
      console.error('Error toggling feature flag:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return { enabled, loading, error, toggleFlag, isLoading };
}