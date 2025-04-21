"use client";

import { useState, useRef, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { X, Move } from 'lucide-react';

export default function FeatureFlagDebug() {
  const { featureFlags, toggleFeatureFlag } = useAppContext();
  const [logs, setLogs] = useState<string[]>([]);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const debugRef = useRef<HTMLDivElement>(null);

  // Only show in development or if explicitly enabled
  const showDebug = process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_SHOW_DEBUG === 'true';
  
  // Add event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
    } else {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
    };
  }, [isDragging]);

  // Add a log entry
  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const handleDragStart = (e: React.MouseEvent) => {
    if (debugRef.current) {
      const rect = debugRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      setIsDragging(true);
    }
  };

  const handleDragMove = (e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      });
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // Handle feature flag toggle
  const handleToggle = async (key: string) => {
    const newValue = !featureFlags[key];
    addLog(`Toggling ${key} to ${newValue ? 'ON' : 'OFF'}`);
    await toggleFeatureFlag(key, newValue);
  };

  // Return null after all hooks have been called
  if (!showDebug || !isVisible) return null;

  return (
    <div 
      ref={debugRef}
      className="fixed bg-black/80 text-white p-4 rounded-lg text-xs z-50 max-w-xs max-h-96 overflow-auto shadow-lg border border-gray-700"
      style={{ 
        top: `${position.y}px`, 
        left: `${position.x}px`,
        cursor: isDragging ? 'grabbing' : 'auto'
      }}
    >
      <div 
        className="absolute top-0 right-0 p-1 cursor-pointer"
        onClick={() => setIsVisible(false)}
      >
        <X size={16} />
      </div>
      
      <div 
        className="absolute top-0 left-0 p-1 cursor-grab"
        onMouseDown={handleDragStart}
      >
        <Move size={16} />
      </div>
      
      <h4 className="font-bold mb-2 mt-4 pl-5">Feature Flag Debug</h4>
      
      <div className="space-y-2 mb-4">
        {Object.entries(featureFlags).map(([key, value]) => (
          <div key={key} className="flex items-center justify-between">
            <span>{key}: {value ? 'ON' : 'OFF'}</span>
            <button 
              className="px-2 py-1 bg-blue-600 rounded text-xs hover:bg-blue-700"
              onClick={() => handleToggle(key)}
            >
              Toggle
            </button>
          </div>
        ))}
      </div>
      
      <h5 className="font-semibold mb-1">Logs:</h5>
      <div className="border border-gray-700 p-2 rounded bg-black/50 h-40 overflow-y-auto">
        {logs.map((log, i) => (
          <div key={i} className="text-xs mb-1">{log}</div>
        ))}
      </div>
    </div>
  );
} 