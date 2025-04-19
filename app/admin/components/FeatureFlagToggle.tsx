import { useState } from 'react';
import axios from 'axios';
import Toggle from '@/components/ui/Toggle';
import { toast } from 'sonner';

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
      await axios.patch(`/api/feature-flags/${id}`, {
        enabled: newState,
      });
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
      <Toggle 
        enabled={enabled} 
        onChange={handleToggle}
        size="lg"
      />
    </div>
  );
} 