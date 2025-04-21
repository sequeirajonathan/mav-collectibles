"use client";

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';

export default function AlertBanner() {
  const { alertBanner } = useAppContext();
  const [isVisible, setIsVisible] = useState(true);
  
  // Reset visibility when banner content changes
  useEffect(() => {
    if (alertBanner) {
      setIsVisible(true);
    }
  }, [alertBanner]);
  
  if (!alertBanner || !isVisible) {
    return null;
  }
  
  return (
    <div 
      className="w-full left-0 right-0 z-50" 
      style={{ 
        backgroundColor: alertBanner.backgroundColor || '#E6B325',
        color: alertBanner.textColor || '#000000',
      }}
    >
      <div className="relative flex items-center justify-center px-4 py-2 text-center">
        <p className="text-sm font-medium pr-6 sm:pr-0">
          {alertBanner.message}
          {alertBanner.code && (
            <span className="ml-2 font-bold">{alertBanner.code}</span>
          )}
        </p>
        <button 
          onClick={() => setIsVisible(false)}
          className="absolute right-4 p-1 rounded-full hover:bg-black/10 transition-colors hidden sm:block"
          aria-label="Close"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
} 