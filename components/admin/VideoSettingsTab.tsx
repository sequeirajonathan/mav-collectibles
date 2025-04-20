"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAppContext } from "@/contexts/AppContext";
import { toast } from "react-hot-toast";
import { AdminVideoSettings, VideoSettings } from "@/types/admin";

export default function VideoSettingsTab() {
  const { videoSettings, updateVideoSettings } = useAppContext();
  
  const [settings, setSettings] = useState<AdminVideoSettings>({
    url: '',
    enabled: false,
    autoplay: false
  });
  
  useEffect(() => {
    if (videoSettings) {
      setSettings({
        url: videoSettings.src || '',
        enabled: videoSettings.isLive || false,
        autoplay: videoSettings.autoplay || false
      });
    }
  }, [videoSettings]);
  
  const handleChange = (field: string, value: string | boolean) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };
  
  const saveSettings = () => {
    // Map AdminVideoSettings to VideoSettings
    const videoSettings: VideoSettings = {
      src: settings.url,
      type: 'application/x-mpegURL', // Default value
      isLive: true,                  // Default value
      poster: '',                    // Default value
      title: 'Live Stream',          // Default value
      autoplay: settings.autoplay,
      muted: true,                   // Default value
      twitchChannel: ''              // Optional
    };
    
    updateVideoSettings(videoSettings);
    toast.success("Video settings saved successfully");
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Direct Streaming Settings</CardTitle>
        <CardDescription>Configure your direct streaming video player</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="streamUrl">Stream URL</Label>
          <Input
            id="streamUrl"
            value={settings.url}
            onChange={(e) => handleChange('url', e.target.value)}
            placeholder="https://example.com/stream"
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="enabled" className="text-lg">Enable Streaming</Label>
            <p className="text-sm text-gray-400">Show the video player when available</p>
          </div>
          <Switch
            id="enabled"
            checked={settings.enabled}
            onCheckedChange={(checked) => handleChange('enabled', checked)}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="autoplay" className="text-lg">Autoplay</Label>
            <p className="text-sm text-gray-400">Automatically play video when page loads</p>
          </div>
          <Switch
            id="autoplay"
            checked={settings.autoplay}
            onCheckedChange={(checked) => handleChange('autoplay', checked)}
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={saveSettings}
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black bg-[#E6B325] text-[#000000] shadow-md hover:bg-[#FFD966] border border-[#B38A00] focus-visible:ring-[#E6B325]/50 font-extrabold tracking-wide uppercase h-10 px-5 py-2.5"
        >
          Save Changes
        </Button>
      </CardFooter>
    </Card>
  );
} 