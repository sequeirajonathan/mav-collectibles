import { useState, useEffect } from 'react';
import axios from 'axios';

export function useFeatureFlag(flagName: string) {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeatureFlag = async () => {
      try {
        const response = await axios.get('/api/feature-flags');
        const flags = response.data;
        const flag = flags.find((f: any) => f.name === flagName);
        setEnabled(flag?.enabled || false);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch feature flag');
        setLoading(false);
      }
    };

    fetchFeatureFlag();
  }, [flagName]);

  return { enabled, loading, error };
} 