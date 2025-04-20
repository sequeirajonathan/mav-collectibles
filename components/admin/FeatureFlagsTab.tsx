"use client";

import { useAppContext } from "@/contexts/AppContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function FeatureFlagsTab() {
  const { featureFlags, updateFeatureFlag } = useAppContext();

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
            checked={featureFlags.showAlertBanner}
            onCheckedChange={(checked) => updateFeatureFlag("showAlertBanner", checked)}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="showFeaturedEvents" className="text-lg">Featured Events</Label>
            <p className="text-sm text-gray-400">Show featured events on the homepage</p>
          </div>
          <Switch
            id="showFeaturedEvents"
            checked={featureFlags.showFeaturedEvents}
            onCheckedChange={(checked) => updateFeatureFlag("showFeaturedEvents", checked)}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="showVideoPlayer" className="text-lg">Video Player</Label>
            <p className="text-sm text-gray-400">Show the direct streaming video player on the homepage</p>
          </div>
          <Switch
            id="showVideoPlayer"
            checked={featureFlags.showVideoPlayer}
            onCheckedChange={(checked) => updateFeatureFlag("showVideoPlayer", checked)}
          />
        </div>
      </CardContent>
    </Card>
  );
} 