import { serverClient } from './axios';

export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  created_at: string;
}

export async function getFeatureFlags(): Promise<FeatureFlag[]> {
  try {
    const response = await serverClient.get('/FeatureFlag');
    return response.data;
  } catch (error) {
    console.error('Error fetching feature flags:', error);
    // Return empty array instead of throwing to prevent breaking the app
    return [];
  }
}

export async function getFeatureFlag(id: string): Promise<FeatureFlag | null> {
  try {
    const response = await serverClient.get(`/FeatureFlag?id=eq.${id}`);
    return response.data[0] || null;
  } catch (error) {
    console.error(`Error fetching feature flag with id ${id}:`, error);
    return null;
  }
}

export async function updateFeatureFlag(id: string, enabled: boolean): Promise<boolean> {
  try {
    await serverClient.patch(`/FeatureFlag?id=eq.${id}`, { enabled });
    return true;
  } catch (error) {
    console.error(`Error updating feature flag with id ${id}:`, error);
    return false;
  }
} 