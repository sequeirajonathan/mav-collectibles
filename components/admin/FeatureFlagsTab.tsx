"use client";

import { useState, useEffect } from "react";
import { useAppContext } from "@/contexts/AppContext";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";

export default function FeatureFlagsTab() {
  const { featureFlags, updateFeatureFlag } = useAppContext();
  const [localFlags, setLocalFlags] = useState({ ...featureFlags });
  const [hasChanges, setHasChanges] = useState(false);

  // Update local state when context changes
  useEffect(() => {
    setLocalFlags({ ...featureFlags });
  }, [featureFlags]);

  // Handle local flag changes
  const handleFlagChange = (flagName: string, checked: boolean) => {
    // Handle mutual exclusivity locally
    const updatedFlags = { ...localFlags, [flagName]: checked };
    
    if (checked) {
      if (flagName === "showYouTubeVideo" && localFlags.showDirectStreaming) {
        updatedFlags.showDirectStreaming = false;
      } else if (flagName === "showDirectStreaming" && localFlags.showYouTubeVideo) {
        updatedFlags.showYouTubeVideo = false;
      }
    }
    
    setLocalFlags(updatedFlags);
    setHasChanges(true);
  };

  // Save all changes at once
  const saveChanges = async () => {
    try {
      // Find which flags have changed
      const changedFlags = Object.entries(localFlags).filter(
        ([key, value]) => featureFlags[key as keyof typeof featureFlags] !== value
      );
      
      // Update all changed flags
      for (const [key, value] of changedFlags) {
        await updateFeatureFlag(key, value);
      }
      
      toast.success("Feature flags updated successfully");
      setHasChanges(false);
    } catch {
      toast.error("Failed to update feature flags");
      // Reset to original values on error
      setLocalFlags({ ...featureFlags });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Feature Flags</CardTitle>
        <CardDescription>Enable or disable features on your site</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="showAlertBanner" className="text-lg">Alert Banner</Label>
            <p className="text-sm text-gray-400">Show the alert banner at the top of the site</p>
          </div>
          <Switch
            id="showAlertBanner"
            checked={localFlags.showAlertBanner || false}
            onCheckedChange={(checked) => handleFlagChange("showAlertBanner", checked)}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="showFeaturedEvents" className="text-lg">Featured Events</Label>
            <p className="text-sm text-gray-400">Show featured events on the homepage</p>
          </div>
          <Switch
            id="showFeaturedEvents"
            checked={localFlags.showFeaturedEvents || false}
            onCheckedChange={(checked) => handleFlagChange("showFeaturedEvents", checked)}
          />
        </div>
        
        <div className="border-t border-gray-700 my-4 pt-4">
          <h3 className="text-lg font-medium mb-2">Video Settings</h3>
          <p className="text-sm text-gray-400 mb-4">Configure video display options</p>
          
          <div className="flex items-center justify-between mb-3">
            <div>
              <Label htmlFor="showVideoPlayer" className="text-base">Video Section</Label>
              <p className="text-sm text-gray-400">Show the video section on the homepage</p>
            </div>
            <Switch
              id="showVideoPlayer"
              checked={localFlags.showVideoPlayer || false}
              onCheckedChange={(checked) => handleFlagChange("showVideoPlayer", checked)}
            />
          </div>
          
          <div className="pl-4 border-l-2 border-gray-700 mt-4 mb-2">
            <h4 className="text-base font-medium mb-2">Video Sources</h4>
            <p className="text-sm text-gray-400 mb-3">Choose which video source to display (only one can be active)</p>
            
            <div className="flex items-center justify-between mb-3">
              <div>
                <Label htmlFor="showYouTubeVideo" className="text-base">YouTube Video</Label>
                <p className="text-sm text-gray-400">Display YouTube videos on the homepage</p>
              </div>
              <Switch
                id="showYouTubeVideo"
                checked={localFlags.showYouTubeVideo || false}
                onCheckedChange={(checked) => handleFlagChange("showYouTubeVideo", checked)}
                disabled={!localFlags.showVideoPlayer}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="showDirectStreaming" className="text-base">Direct Streaming</Label>
                <p className="text-sm text-gray-400">Display direct streaming video on the homepage</p>
              </div>
              <Switch
                id="showDirectStreaming"
                checked={localFlags.showDirectStreaming || false}
                onCheckedChange={(checked) => handleFlagChange("showDirectStreaming", checked)}
                disabled={!localFlags.showVideoPlayer}
              />
            </div>
          </div>
        </div>
      </CardContent>
      
      {hasChanges && (
        <CardFooter>
          <div className="flex justify-between w-full">
            <Button 
              variant="outline" 
              onClick={() => {
                setLocalFlags({ ...featureFlags });
                setHasChanges(false);
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={saveChanges}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black bg-[#E6B325] text-[#000000] shadow-md hover:bg-[#FFD966] border border-[#B38A00] focus-visible:ring-[#E6B325]/50 font-extrabold tracking-wide uppercase h-10 px-5 py-2.5"
            >
              Save Changes
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
} 