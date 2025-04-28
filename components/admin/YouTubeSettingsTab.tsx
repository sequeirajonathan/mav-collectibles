"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Label } from "@components/ui/label";
import { Input } from "@components/ui/input";
import { Switch } from "@components/ui/switch";
import { Button } from "@components/ui/button";
import { useAppContext } from "@contexts/AppContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@components/ui/tabs";
import { toast } from "react-hot-toast";

export default function YouTubeSettingsTab() {
  const { youtubeSettings, updateYoutubeSettings, refreshData } = useAppContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [settings, setSettings] = useState({
    videoId: youtubeSettings?.videoId || "",
    title: youtubeSettings?.title || "",
    autoplay: youtubeSettings?.autoplay || false,
    muted: youtubeSettings?.muted || false,
    playlistId: youtubeSettings?.playlistId || "",
    isLiveStream: youtubeSettings?.isLiveStream || false,
    liveStreamId: youtubeSettings?.liveStreamId || "",
    showLiveIndicator: youtubeSettings?.showLiveIndicator || true,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings((prev) => ({ ...prev, [name]: value }));
  };

  const handleToggle = (name: string) => (value: boolean) => {
    setSettings((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await updateYoutubeSettings(settings);
      toast.success("YouTube settings saved successfully!");
      
      // Refresh data after saving
      setTimeout(() => {
        refreshData();
      }, 500);
    } catch (error) {
      console.error("Error saving YouTube settings:", error);
      toast.error("Failed to save YouTube settings. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Advanced YouTube Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs defaultValue="video" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="video">Video</TabsTrigger>
              <TabsTrigger value="livestream">Live Stream</TabsTrigger>
            </TabsList>
            
            <TabsContent value="video" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="videoId">YouTube Video ID</Label>
                <Input
                  id="videoId"
                  name="videoId"
                  value={settings.videoId}
                  onChange={handleChange}
                  placeholder="e.g. dQw4w9WgXcQ"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="title">Video Title</Label>
                <Input
                  id="title"
                  name="title"
                  value={settings.title}
                  onChange={handleChange}
                  placeholder="Featured Video Title"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="playlistId">Playlist ID (optional)</Label>
                <Input
                  id="playlistId"
                  name="playlistId"
                  value={settings.playlistId}
                  onChange={handleChange}
                  placeholder="YouTube Playlist ID"
                />
              </div>
            </TabsContent>
            
            <TabsContent value="livestream" className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="isLiveStream">Enable Live Stream</Label>
                <Switch
                  id="isLiveStream"
                  checked={settings.isLiveStream}
                  onCheckedChange={handleToggle("isLiveStream")}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="liveStreamId">Live Stream ID</Label>
                <Input
                  id="liveStreamId"
                  name="liveStreamId"
                  value={settings.liveStreamId}
                  onChange={handleChange}
                  placeholder="YouTube Live Stream ID"
                  disabled={!settings.isLiveStream}
                />
                <p className="text-xs text-gray-500">
                  This is the ID of your YouTube live stream. You can find it in the URL of your live stream page.
                </p>
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="showLiveIndicator">Show Live Indicator</Label>
                <Switch
                  id="showLiveIndicator"
                  checked={settings.showLiveIndicator}
                  onCheckedChange={handleToggle("showLiveIndicator")}
                  disabled={!settings.isLiveStream}
                />
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <Label htmlFor="autoplay">Autoplay Video</Label>
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
          </div>
          
          <Button 
            type="submit" 
            variant="primary" 
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Save YouTube Settings"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
} 