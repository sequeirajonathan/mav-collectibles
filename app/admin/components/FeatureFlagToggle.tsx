import { useState } from 'react';
import Toggle from '@/components/ui/Toggle';
import { toast } from 'sonner';
import Spinner from '@/components/ui/Spinner';

interface FeatureFlagToggleProps {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  onToggle?: (enabled: boolean) => void;
}

export default function FeatureFlagToggle({
  id,
  name,
  description,
  enabled: initialEnabled,
  onToggle,
}: FeatureFlagToggleProps) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async (newState: boolean) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/feature-flags/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          value: newState,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      setEnabled(newState);
      if (onToggle) onToggle(newState);
      toast.success(`${name} is now ${newState ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Failed to update feature flag:', error);
      toast.error('Failed to update feature flag');
      // Revert the toggle if the API call fails
      setEnabled(!newState);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-800">
      <div className="flex-1">
        <h3 className="text-lg font-medium text-white">{name}</h3>
        {description && <p className="text-sm text-gray-400">{description}</p>}
      </div>
      {isLoading ? <Spinner /> : <Toggle 
        enabled={enabled} 
        onChange={handleToggle}
        size="lg"
      />}
    </div>
  );
} 