"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@components/ui/card";
import { Label } from "@components/ui/label";
import { Input } from "@components/ui/input";
import { Button } from "@components/ui/button";
import { Switch } from "@components/ui/switch";
import { useAppContext } from "@contexts/AppContext";
import { toast } from "react-hot-toast";
import { AdminVideoSettings, VideoSettings } from "interfaces/admin";

export default function VideoSettingsTab() {
  const { videoSettings, updateVideoSettings, getFeatureFlag } = useAppContext();
  const showDirectStreaming = getFeatureFlag('showDirectStreaming');
  
  const [settings, setSettings] = useState<AdminVideoSettings>({
    url: '',
    autoplay: false
  });
  
  useEffect(() => {
    if (videoSettings) {
      setSettings({
        url: videoSettings.src || '',
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
        <CardDescription>
          Configure your direct streaming video player. 
          {!showDirectStreaming && (
            <span className="text-amber-500 block mt-1">
              Note: Enable the &quot;Direct Streaming&quot; feature flag to display this video.
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="streamUrl">Stream URL</Label>
          <Input
            id="streamUrl"
            value={settings.url}
            onChange={(e) => handleChange('url', e.target.value)}
            placeholder="https://example.com/stream/index.m3u8 or https://twitch.tv/channel"
          />
          <p className="text-xs text-gray-400 mt-1">
            Enter a valid HLS stream URL (usually ending with .m3u8) or a Twitch channel URL
          </p>
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
          variant="gold"
        >
          Save Changes
        </Button>
      </CardFooter>
    </Card>
  );
} 