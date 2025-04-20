"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useAppContext } from "@/contexts/AppContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "react-hot-toast";

export default function VideoSettingsTab() {
  const { videoSettings, updateVideoSettings, refreshData } = useAppContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [settings, setSettings] = useState({
    src: videoSettings.src || "",
    type: videoSettings.type || "application/x-mpegURL",
    isLive: videoSettings.isLive || false,
    poster: videoSettings.poster || "",
    title: videoSettings.title || "",
    autoplay: videoSettings.autoplay || false,
    muted: videoSettings.muted || false,
    twitchChannel: videoSettings.twitchChannel || "",
  });

  const extractTwitchChannel = (url: string): string | null => {
    if (!url) return null;
    
    try {
      const twitchUrlRegex = /^(?:https?:\/\/)?(?:www\.)?twitch\.tv\/([a-zA-Z0-9_]{4,25})(?:\/.*)?$/;
      const match = url.match(twitchUrlRegex);
      
      if (match && match[1]) {
        return match[1];
      }
      
      return null;
    } catch (error) {
      console.error('Error parsing Twitch URL:', error);
      return null;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'src') {
      const twitchChannel = extractTwitchChannel(value);
      
      if (twitchChannel) {
        setSettings((prev) => ({ 
          ...prev, 
          src: value,
          twitchChannel: twitchChannel 
        }));
        return;
      }
    }
    
    setSettings((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string) => (value: string) => {
    setSettings((prev) => ({ ...prev, [name]: value }));
  };

  const handleToggle = (name: string) => (value: boolean) => {
    console.log(`Toggling ${name} to ${value}`);
    setSettings((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await updateVideoSettings(settings);
      toast.success("Video settings saved successfully!");
      
      // Refresh data after saving
      setTimeout(() => {
        refreshData();
      }, 500);
    } catch (error) {
      console.error("Error saving video settings:", error);
      toast.error("Failed to save video settings. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Direct Streaming Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="src">Stream URL</Label>
            <Input
              id="src"
              name="src"
              value={settings.src}
              onChange={handleChange}
              placeholder="e.g. https://example.com/live/stream.m3u8 or https://twitch.tv/shroud"
            />
            <p className="text-xs text-gray-500">
              URL to your HLS (.m3u8), DASH (.mpd) stream, or Twitch channel
            </p>
            {settings.twitchChannel && (
              <p className="text-xs text-green-500">
                ✓ Twitch channel detected: {settings.twitchChannel}
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="type">Stream Type</Label>
            <Select 
              value={settings.type} 
              onValueChange={handleSelectChange("type")}
            >
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                <SelectValue placeholder="Select stream type" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700 text-white">
                <SelectItem value="application/x-mpegURL">HLS (.m3u8)</SelectItem>
                <SelectItem value="application/dash+xml">DASH (.mpd)</SelectItem>
                <SelectItem value="video/mp4">MP4</SelectItem>
                <SelectItem value="video/webm">WebM</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="title">Stream Title</Label>
            <Input
              id="title"
              name="title"
              value={settings.title}
              onChange={handleChange}
              placeholder="Live Stream Title"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="poster">Poster Image URL</Label>
            <Input
              id="poster"
              name="poster"
              value={settings.poster}
              onChange={handleChange}
              placeholder="https://example.com/poster.jpg"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="twitchChannel">Twitch Channel</Label>
            <Input
              id="twitchChannel"
              name="twitchChannel"
              value={settings.twitchChannel || ""}
              onChange={handleChange}
              placeholder="e.g. twitchpresents"
            />
            <p className="text-xs text-gray-500">
              Enter a Twitch channel name to embed their live stream
            </p>
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="isLive">Live Stream Mode</Label>
            <Switch
              id="isLive"
              checked={settings.isLive}
              onCheckedChange={handleToggle("isLive")}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="autoplay">Autoplay</Label>
            <Switch
              id="autoplay"
              checked={settings.autoplay}
              onCheckedChange={handleToggle("autoplay")}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="muted">Muted by Default</Label>
            <Switch
              id="muted"
              checked={settings.muted}
              onCheckedChange={handleToggle("muted")}
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black bg-[#E6B325] text-[#000000] shadow-md hover:bg-[#FFD966] border border-[#B38A00] focus-visible:ring-[#E6B325]/50 font-extrabold tracking-wide uppercase h-10 px-5 py-2.5"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Save Stream Settings"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
} 