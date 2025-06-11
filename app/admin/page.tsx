"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@components/ui/tabs";
import FeatureFlagsTab from "@components/admin/FeatureFlagsTab";
import AlertBannerTab from "@components/admin/AlertBannerTab";
import FeaturedEventsTab from "@components/admin/FeaturedEventsTab";
import YouTubeVideoTab from "@components/admin/YouTubeVideoTab";
import VideoSettingsTab from "@components/admin/VideoSettingsTab";
import RolesTab from "@components/admin/RolesTab";
import DownloadsTab from "@components/admin/DownloadsTab";
import InstallerUploadTab from "@components/admin/InstallerUploadTab";
import { useUser } from "@clerk/nextjs";
import { UserRole } from "@interfaces/roles";
import { redirect } from "next/navigation";
import { useEffect } from "react";
import "@styles/admin.css";

export default function AdminDashboard() {
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (isLoaded && user) {
      const role = user.publicMetadata?.role as string || UserRole.USER;
      if (role !== UserRole.ADMIN) {
        redirect('/');
      }
    }
  }, [isLoaded, user]);

  if (!isLoaded || !user) {
    return null;
  }

  const role = user.publicMetadata?.role as string || UserRole.USER;
  if (role !== UserRole.ADMIN) {
    return null;
  }

  return (
    <div className="mx-auto py-8 pb-12 px-2 sm:px-4 max-w-4xl w-full">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-[#E6B325]">Admin Dashboard</h1>
      <Tabs 
        defaultValue={typeof window !== 'undefined' ? window.location.hash.slice(1) || 'feature-flags' : 'feature-flags'} 
        className="w-full"
        onValueChange={(value) => {
          if (typeof window !== 'undefined') {
            window.location.hash = value;
          }
        }}
      >
        <div className="overflow-x-auto pb-2">
          <TabsList className="flex flex-col sm:flex-row w-full mb-4 sm:mb-6 gap-1 sm:gap-2">
            <TabsTrigger value="feature-flags" className="text-xs sm:text-sm px-2 sm:px-4 py-1 text-left sm:text-center justify-start sm:justify-center w-full">Feature Flags</TabsTrigger>
            <TabsTrigger value="alert-banner" className="text-xs sm:text-sm px-2 sm:px-4 py-1 text-left sm:text-center justify-start sm:justify-center w-full">Alert Banner</TabsTrigger>
            <TabsTrigger value="featured-events" className="text-xs sm:text-sm px-2 sm:px-4 py-1 text-left sm:text-center justify-start sm:justify-center w-full">Featured Events</TabsTrigger>
            <TabsTrigger value="youtube-video" className="text-xs sm:text-sm px-2 sm:px-4 py-1 text-left sm:text-center justify-start sm:justify-center w-full">YouTube Video</TabsTrigger>
            <TabsTrigger value="direct-streaming" className="text-xs sm:text-sm px-2 sm:px-4 py-1 text-left sm:text-center justify-start sm:justify-center w-full">Direct Streaming</TabsTrigger>
            <TabsTrigger value="roles" className="text-xs sm:text-sm px-2 sm:px-4 py-1 text-left sm:text-center justify-start sm:justify-center w-full">User Roles</TabsTrigger>
            <TabsTrigger value="downloads" className="text-xs sm:text-sm px-2 sm:px-4 py-1 text-left sm:text-center justify-start sm:justify-center w-full">Downloads</TabsTrigger>
            <TabsTrigger value="upload-installer" className="text-xs sm:text-sm px-2 sm:px-4 py-1 text-left sm:text-center justify-start sm:justify-center w-full">Upload Installer</TabsTrigger>
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
        <TabsContent value="roles">
          <RolesTab />
        </TabsContent>
        <TabsContent value="downloads">
          <DownloadsTab />
        </TabsContent>
        <TabsContent value="upload-installer">
          <InstallerUploadTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
