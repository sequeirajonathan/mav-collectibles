import { Suspense } from "react";
import { PageHeader } from "@components/hub/page-header";
import { BannerForm, FlagToggles, MediaForms } from "@components/admin/site-settings";
import { requirePageRole } from "@lib/auth/guard";
import { UserRole } from "@interfaces/roles";
import { getAlertBanner, getVideoSettings, getYouTubeSettings, listFlagRows } from "@lib/data/site";

async function Settings() {
  await requirePageRole([UserRole.ADMIN], "/admin/site");
  const [flags, banner, youtube, video] = await Promise.all([listFlagRows(), getAlertBanner(), getYouTubeSettings(), getVideoSettings()]);
  return (
    <div className="space-y-8">
      <section><h2 className="mb-3 text-lg font-bold">Features</h2><FlagToggles flags={flags} /></section>
      <section><h2 className="mb-3 text-lg font-bold">Alert banner</h2><BannerForm banner={banner} /></section>
      <section><h2 className="mb-3 text-lg font-bold">Video</h2><MediaForms youtube={youtube} video={video} /></section>
    </div>
  );
}

export default function AdminSitePage() {
  return (
    <>
      <PageHeader title="Site settings" />
      <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-panel" />}>
        <Settings />
      </Suspense>
    </>
  );
}
