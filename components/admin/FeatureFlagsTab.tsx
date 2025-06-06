"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@components/ui/card";
import { Label } from "@components/ui/label";
import { Switch } from "@components/ui/switch";
import { Button } from "@components/ui/button";
import { toast } from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { useFeatureFlags, useSeedFeatureFlags, useUpdateFeatureFlag } from "@hooks/useFeatureFlag";

type LocalFlags = Record<string, boolean>;

export default function FeatureFlagsTab() {
  const { data: featureFlags, isLoading, error } = useFeatureFlags();
  const [localFlags, setLocalFlags] = useState<LocalFlags>({});
  const [hasChanges, setHasChanges] = useState(false);

  const { mutate: triggerSeed } = useSeedFeatureFlags();
  const { mutate: triggerUpdateFlag } = useUpdateFeatureFlag();

  useEffect(() => {
    if (featureFlags) {
      const flagsObject: LocalFlags = featureFlags.reduce((acc, flag) => {
        acc[flag.name] = flag.enabled;
        return acc;
      }, {} as LocalFlags);
      setLocalFlags(flagsObject);
    }
  }, [featureFlags]);

  const handleSeedFeatureFlags = async () => {
    try {
      await triggerSeed();
      toast.success('Feature flags initialized successfully');
      window.location.reload();
    } catch {
      toast.error('Failed to initialize feature flags');
    }
  };

  const handleFlagChange = (flagName: string, checked: boolean) => {
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

  const saveChanges = async () => {
    if (!featureFlags) return;

    const changedFlags = Object.entries(localFlags).filter(([key, value]) => {
      const original = featureFlags.find(flag => flag.name === key);
      return original && original.enabled !== value;
    });

    try {
      for (const [name, enabled] of changedFlags) {
        const flag = featureFlags.find(f => f.name === name);
        if (flag) {
          await triggerUpdateFlag({ id: flag.id, enabled });
        }
      }

      toast.success("Feature flags updated successfully");
      setHasChanges(false);
    } catch {
      toast.error('Feature flag update failed. Trying to reinitialize...');
      await handleSeedFeatureFlags();
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="animate-spin w-6 h-6" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-full">
        <p className="text-red-500">Failed to load feature flags</p>
      </div>
    );
  }

  if (!featureFlags) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Feature Flags</CardTitle>
        <CardDescription>Enable or disable features on your site</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {featureFlags.length === 0 && (
          <div className="flex justify-center mb-4">
            <Button
              onClick={handleSeedFeatureFlags}
              className="bg-[#E6B325] text-black hover:bg-[#FFD966]"
            >
              Initialize Feature Flags
            </Button>
          </div>
        )}

        {/* ---- Basic Flags Section ---- */}
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
            <Label htmlFor="showGoogleReviews" className="text-lg">Google Reviews</Label>
            <p className="text-sm text-gray-400">Show Google Reviews section on the homepage</p>
          </div>
          <Switch
            id="showGoogleReviews"
            checked={localFlags.showGoogleReviews || false}
            onCheckedChange={(checked) => handleFlagChange("showGoogleReviews", checked)}
          />
        </div>

        {/* ---- Divider + Video Settings ---- */}
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
                if (featureFlags) {
                  const flagsObject: LocalFlags = featureFlags.reduce((acc, flag) => {
                    acc[flag.name] = flag.enabled;
                    return acc;
                  }, {} as LocalFlags);
                  setLocalFlags(flagsObject);
                }
                setHasChanges(false);
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={saveChanges}
              variant="gold"
            >
              Save Changes
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
