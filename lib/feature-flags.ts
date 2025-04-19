export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  created_at: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export async function getFeatureFlags(): Promise<FeatureFlag[]> {
  try {
    const response = await fetch(`${API_URL}/feature-flags`);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching feature flags:', error);
    // Return empty array instead of throwing to prevent breaking the app
    return [];
  }
}

export async function getFeatureFlag(id: string): Promise<FeatureFlag | null> {
  try {
    const response = await fetch(`${API_URL}/feature-flags/${id}`);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    return data || null;
  } catch (error) {
    console.error(`Error fetching feature flag with id ${id}:`, error);
    return null;
  }
}

export async function updateFeatureFlag(id: string, enabled: boolean): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/feature-flags/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ enabled }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    return true;
  } catch (error) {
    console.error(`Error updating feature flag with id ${id}:`, error);
    return false;
  }
} 