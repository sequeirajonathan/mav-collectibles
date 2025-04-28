import { axiosClient } from '@lib/axios';
import { FeatureFlag } from '@interfaces';

export async function fetchFeatureFlags(): Promise<FeatureFlag[]> {
  const { data } = await axiosClient.get('/api/feature-flags');
  return data;
}

export async function updateFeatureFlag(id: string, enabled: boolean): Promise<FeatureFlag> {
  const { data } = await axiosClient.patch(`/api/feature-flags/${id}`, { enabled });
  return data;
}

export async function seedFeatureFlags(): Promise<void> {
  await axiosClient.post('/api/feature-flags/seed');
}
