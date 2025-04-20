"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import FeatureFlagToggle from "./FeatureFlagToggle";

export default function FeatureFlagsTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Feature Flags</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <FeatureFlagToggle
            name="showAlertBanner"
            label="Alert Banner"
            description="Show the alert banner at the top of the site"
          />
          
          <FeatureFlagToggle
            name="showFeaturedEvents"
            label="Featured Events"
            description="Show featured events on the homepage"
          />
          
          <FeatureFlagToggle
            name="showVideoPlayer"
            label="Video Player"
            description="Show the direct streaming video player on the homepage"
          />
          
          <FeatureFlagToggle
            name="showYouTubeVideo"
            label="YouTube Video"
            description="Show the YouTube video on the homepage"
          />
        </div>
      </CardContent>
    </Card>
  );
} 