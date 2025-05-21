"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@components/ui/tabs";
import FeatureFlagsTab from "@components/admin/FeatureFlagsTab";
import AlertBannerTab from "@components/admin/AlertBannerTab";
import FeaturedEventsTab from "@components/admin/FeaturedEventsTab";
import YouTubeVideoTab from "@components/admin/YouTubeVideoTab";
import VideoSettingsTab from "@components/admin/VideoSettingsTab";
import "@styles/admin.css";

export default function AdminDashboard() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6 text-[#E6B325]">Admin Dashboard</h1>
      
      <Tabs defaultValue="feature-flags" className="w-full">
        <div className="overflow-x-auto pb-2">
          <TabsList className="mb-6 inline-flex min-w-full">
            <TabsTrigger value="feature-flags">Feature Flags</TabsTrigger>
            <TabsTrigger value="alert-banner">Alert Banner</TabsTrigger>
            <TabsTrigger value="featured-events">Featured Events</TabsTrigger>
            <TabsTrigger value="youtube-video">YouTube Video</TabsTrigger>
            <TabsTrigger value="direct-streaming">Direct Streaming</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="feature-flags">
          <FeatureFlagsTab />
        </TabsContent>
        
        <TabsContent value="alert-banner">
          <AlertBannerTab />
        </TabsContent>
        
        <TabsContent value="featured-events">
          <FeaturedEventsTab />
        </TabsContent>
        
        <TabsContent value="youtube-video">
          <YouTubeVideoTab />
        </TabsContent>
        
        <TabsContent value="direct-streaming">
          <VideoSettingsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
