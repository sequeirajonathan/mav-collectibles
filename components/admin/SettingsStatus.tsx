"use client";

import { useAppContext } from '@/contexts/AppContext';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

export default function SettingsStatus() {
  const { refreshData, lastUpdated } = useAppContext();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshData();
    setIsRefreshing(false);
  };
  
  return (
    <div className="bg-gray-800 p-4 rounded-lg mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Settings Status</h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh Now'}
        </Button>
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-400">YouTube Settings</p>
          <p className="text-white">
            {lastUpdated.youtubeSettings 
              ? `Last updated: ${new Date(lastUpdated.youtubeSettings).toLocaleTimeString()}`
              : 'Not yet loaded'}
          </p>
        </div>
        
        <div>
          <p className="text-gray-400">Video Settings</p>
          <p className="text-white">
            {lastUpdated.videoSettings 
              ? `Last updated: ${new Date(lastUpdated.videoSettings).toLocaleTimeString()}`
              : 'Not yet loaded'}
          </p>
        </div>
      </div>
    </div>
  );
} 