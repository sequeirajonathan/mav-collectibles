import { axiosClient } from '@lib/axios';
import { FeatureFlag } from '@interfaces';

export async function fetchFeatureFlags(): Promise<FeatureFlag[]> {
  const { data } = await axiosClient.get('/feature-flags');
  return data;
}

export async function updateFeatureFlag(id: string, enabled: boolean): Promise<FeatureFlag> {
  const { data } = await axiosClient.patch(`/feature-flags/${id}`, { enabled });
  return data;
}

export async function seedFeatureFlags(): Promise<void> {
  await axiosClient.post('/feature-flags/seed');
}
