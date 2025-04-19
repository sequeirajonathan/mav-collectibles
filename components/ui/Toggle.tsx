import React from 'react';
import { Switch } from '@headlessui/react';
import { cn } from '@/lib/utils';

interface ToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  label?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function Toggle({
  enabled,
  onChange,
  label,
  description,
  size = 'md',
}: ToggleProps) {
  const sizes = {
    sm: {
      switch: 'h-5 w-9',
      dot: 'h-3 w-3',
      translate: 'translate-x-4',
    },
    md: {
      switch: 'h-6 w-11',
      dot: 'h-4 w-4',
      translate: 'translate-x-5',
    },
    lg: {
      switch: 'h-7 w-14',
      dot: 'h-5 w-5',
      translate: 'translate-x-7',
    },
  };

  return (
    <Switch.Group>
      <div className="flex items-center">
        {(label || description) && (
          <div className="mr-4">
            {label && (
              <Switch.Label className="text-sm font-medium text-gray-200">
                {label}
              </Switch.Label>
            )}
            {description && (
              <p className="text-xs text-gray-400">{description}</p>
            )}
          </div>
        )}
        <Switch
          checked={enabled}
          onChange={onChange}
          className={cn(
            enabled ? 'bg-emerald-600' : 'bg-gray-700',
            `relative inline-flex ${sizes[size].switch} shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75`
          )}
        >
          <span className="sr-only">Toggle feature</span>
          <span
            aria-hidden="true"
            className={cn(
              enabled ? sizes[size].translate : 'translate-x-0',
              `pointer-events-none inline-block ${sizes[size].dot} transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out`
            )}
          />
        </Switch>
      </div>
    </Switch.Group>
  );
} 