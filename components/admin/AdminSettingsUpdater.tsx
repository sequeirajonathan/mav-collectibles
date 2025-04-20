"use client";

import { useAppContext } from '@/contexts/AppContext';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useState } from 'react';

export default function AdminSettingsUpdater() {
  const { refreshData } = useAppContext();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshData();
    setIsRefreshing(false);
    toast.success('Settings refreshed');
  };
  
  return (
    <div className="fixed bottom-4 left-4 z-50">
      <Button 
        onClick={handleRefresh}
        disabled={isRefreshing}
        className="flex items-center gap-2"
      >
        <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        {isRefreshing ? 'Refreshing...' : 'Refresh Settings'}
      </Button>
    </div>
  );
} 