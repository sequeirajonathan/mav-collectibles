"use client";

import { useState, useEffect } from "react";
import { Switch } from "@components/ui/switch";
import { Label } from "@components/ui/label";
import { useAppContext } from "@contexts/AppContext";
import { toast } from "react-hot-toast";

interface FeatureFlagToggleProps {
  name: string;
  label: string;
  description?: string;
}

export default function FeatureFlagToggle({ 
  name, 
  label, 
  description 
}: FeatureFlagToggleProps) {
  const { featureFlags, updateFeatureFlag } = useAppContext();
  const [isUpdating, setIsUpdating] = useState(false);
  const [localChecked, setLocalChecked] = useState(false);
  
  // Initialize local state from context
  useEffect(() => {
    if (featureFlags) {
      const flag = featureFlags.find(f => f.name === name);
      if (flag) {
        setLocalChecked(flag.enabled);
      }
    }
  }, [featureFlags, name]);
  
  // Store in localStorage for even faster initial render
  useEffect(() => {
    const storedValue = localStorage.getItem(`featureFlag_${name}`);
    if (storedValue !== null) {
      setLocalChecked(storedValue === 'true');
    }
  }, [name]);
  
  const handleToggle = async () => {
    try {
      // Set updating state
      setIsUpdating(true);
      
      // Update local state immediately for responsive UI
      const newValue = !localChecked;
      setLocalChecked(newValue);
      
      // Store in localStorage for persistence
      localStorage.setItem(`featureFlag_${name}`, String(newValue));
      
      // Call API to update in background
      await updateFeatureFlag(name, newValue);
      
      // Show success message
      toast.success(`${label} ${newValue ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error(`Error toggling ${name}:`, error);
      
      // Revert local state on error
      setLocalChecked(!localChecked);
      localStorage.setItem(`featureFlag_${name}`, String(!localChecked));
      
      // Show error message
      toast.error(`Failed to update ${label}`);
    } finally {
      // Clear updating state
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex items-center justify-between">
      <div>
        <Label htmlFor={name} className="text-base">{label}</Label>
        {description && <p className="text-sm text-gray-500">{description}</p>}
      </div>
      <Switch
        id={name}
        checked={localChecked}
        onCheckedChange={handleToggle}
        disabled={isUpdating}
      />
    </div>
  );
} 