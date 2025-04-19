import { useState, useEffect } from 'react';

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
        const response = await fetch('/api/feature-flags');
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const flags: FeatureFlag[] = await response.json();
        const flag = flags.find((f) => f.name === flagName);
        setEnabled(flag?.enabled || false);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch feature flag';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchFeatureFlag();
  }, [flagName]);

  const toggleFlag = async (flagId: string, isEnabled: boolean): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/feature-flags/${flagId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enabled: isEnabled }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      setEnabled(isEnabled);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error toggling feature flag';
      console.error(errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return { enabled, loading, error, toggleFlag, isLoading };
}