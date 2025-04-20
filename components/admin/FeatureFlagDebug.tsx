"use client";

import { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';

export default function FeatureFlagDebug() {
  const { featureFlags, updateFeatureFlag } = useAppContext();
  const [logs, setLogs] = useState<string[]>([]);
  
  // Add a log entry
  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };
  
  // Test function to toggle a flag
  const testToggle = async (name: string) => {
    const currentValue = featureFlags[name as keyof typeof featureFlags];
    addLog(`Attempting to toggle ${name} from ${currentValue} to ${!currentValue}`);
    
    try {
      await updateFeatureFlag(name, !currentValue);
      addLog(`Toggle result: Success`);
    } catch (error) {
      addLog(`Toggle result: Failed - ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }
  
  return (
    <div className="fixed top-20 right-4 bg-black/80 text-white p-4 rounded-lg text-xs z-50 max-w-xs max-h-96 overflow-auto">
      <h4 className="font-bold mb-2">Feature Flag Debug</h4>
      
      <div className="space-y-2 mb-4">
        {Object.entries(featureFlags).map(([name, value]) => (
          <div key={name} className="flex items-center justify-between">
            <span>{name}: {value ? 'ON' : 'OFF'}</span>
            <button 
              onClick={() => testToggle(name)}
              className="px-2 py-1 bg-blue-600 rounded text-xs"
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