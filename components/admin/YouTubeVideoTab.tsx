"use client";

import { useState, useEffect, memo } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@components/ui/card";
import { Label } from "@components/ui/label";
import { Input } from "@components/ui/input";
import { Button } from "@components/ui/button";
import { Checkbox } from "@components/ui/checkbox";
import { toast } from "react-hot-toast";
import { useFeatureFlags } from "@hooks/useFeatureFlag";
import { useYoutubeSettings, useUpdateYoutubeSettings } from "@hooks/useYoutubeSettings";
import { Loader2 } from "lucide-react";

// Define the props type for YouTubePreview
interface YouTubePreviewProps {
  settings: {
    videoId: string;
    title: string;
    autoplay: boolean;
    muted: boolean;
    playlistId?: string;
  };
}

// Memoize child components that don't change often
const YouTubePreview = memo(({ settings }: YouTubePreviewProps) => (
  <div className="mt-6 border rounded-lg p-4">
    <h3 className="font-medium mb-2">Preview</h3>
    <div className="aspect-video w-full bg-gray-900 rounded">
      <iframe
        src={`https://www.youtube.com/embed/${settings.videoId}?rel=0&modestbranding=1&color=white&controls=1${settings.autoplay ? '&autoplay=1' : ''}${settings.muted ? '&mute=1' : ''}${settings.playlistId ? `&list=${settings.playlistId}` : ''}`}
        title={settings.title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="w-full h-full rounded"
      />
    </div>
  </div>
));

YouTubePreview.displayName = 'YouTubePreview';

export default function YouTubeVideoTab() {
  const { data: featureFlags } = useFeatureFlags();
  const { data: youtubeSettings, isLoading } = useYoutubeSettings();
  const { mutate: updateSettings } = useUpdateYoutubeSettings();

  const showYouTubeVideo = featureFlags?.find(f => f.name === 'showYouTubeVideo')?.enabled;

  const [localYoutubeSettings, setLocalYoutubeSettings] = useState({
    videoId: '',
    title: '',
    autoplay: false,
    muted: false,
    playlistId: ''
  });

  useEffect(() => {
    if (youtubeSettings) {
      setLocalYoutubeSettings({
        ...youtubeSettings,
        playlistId: youtubeSettings.playlistId || ''
      });
    }
  }, [youtubeSettings]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="animate-spin w-6 h-6" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>YouTube Video Settings</CardTitle>
        <CardDescription>
          Configure the featured YouTube video on your site.
          {!showYouTubeVideo && (
            <span className="text-amber-500 block mt-1">
              Note: Enable the &quot;YouTube Video&quot; feature flag to display this video.
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="videoId">YouTube Video ID</Label>
          <Input
            id="videoId"
            value={localYoutubeSettings.videoId}
            onChange={(e) => setLocalYoutubeSettings({...localYoutubeSettings, videoId: e.target.value})}
            placeholder="e.g. dQw4w9WgXcQ"
          />
        </div>
        
        <div>
          <Label htmlFor="videoTitle">Video Title</Label>
          <Input
            id="videoTitle"
            value={localYoutubeSettings.title}
            onChange={(e) => setLocalYoutubeSettings({...localYoutubeSettings, title: e.target.value})}
            placeholder="Featured Video"
          />
        </div>
        
        <div>
          <Label htmlFor="playlistId">Playlist ID (Optional)</Label>
          <Input
            id="playlistId"
            value={localYoutubeSettings.playlistId || ''}
            onChange={(e) => setLocalYoutubeSettings({...localYoutubeSettings, playlistId: e.target.value})}
            placeholder="Leave empty for single video"
          />
        </div>
        
        <div className="flex space-x-6">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="autoplay" 
              checked={localYoutubeSettings.autoplay}
              onCheckedChange={(checked) => 
                setLocalYoutubeSettings({...localYoutubeSettings, autoplay: checked === true})
              }
            />
            <Label htmlFor="autoplay">Autoplay</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="muted" 
              checked={localYoutubeSettings.muted}
              onCheckedChange={(checked) => 
                setLocalYoutubeSettings({...localYoutubeSettings, muted: checked === true})
              }
            />
            <Label htmlFor="muted">Muted</Label>
          </div>
        </div>
        
        <p className="text-xs text-amber-500 mt-2">
          Note: Most browsers require videos to be muted when autoplay is enabled.
        </p>
        
        <YouTubePreview settings={localYoutubeSettings} />
      </CardContent>
      <CardFooter>
        <Button 
          onClick={async () => {
            try {
              await updateSettings(localYoutubeSettings);
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : 'Unknown error';
              toast.error(`Failed to save YouTube settings: ${errorMessage}`);
            }
          }}
          variant="gold"
        >
          Save Changes
        </Button>
      </CardFooter>
    </Card>
  );
} 