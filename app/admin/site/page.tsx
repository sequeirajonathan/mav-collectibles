import { Suspense } from "react";
import { PageHeader } from "@components/ui/page-header";
import { Skeleton } from "@components/ui/skeleton";
import { BannerForm, CommunityForm, FlagToggles, MediaForms } from "@components/admin/site-settings";
import { ServiceKeysPanel } from "@components/admin/service-keys-panel";
import { listServiceKeyStatus } from "@lib/service-keys";
import { requirePageRole } from "@lib/auth/guard";
import { UserRole } from "@interfaces/roles";
import { getAlertBanner, getCommunity, getVideoSettings, getYouTubeSettings, listFlagRows } from "@lib/data/site";
import { requestTime } from "@lib/hub-rules";
import { searchIndexStatus } from "@lib/catalog/search-index";
import { SearchIndexPanel } from "@components/admin/search-index-panel";

// Rebuilding the search index reads the whole catalog; give that action room.
export const maxDuration = 300;

async function Settings() {
  await requirePageRole([UserRole.ADMIN], "/admin/site");
  const [flags, banner, youtube, video, community, index, serviceKeys] = await Promise.all([
    listFlagRows(),
    getAlertBanner(),
    getYouTubeSettings(),
    getVideoSettings(),
    getCommunity(),
    searchIndexStatus(),
    listServiceKeyStatus(),
  ]);
  return (
    <div className="space-y-8">
      <section><h2 className="mb-3 text-lg font-bold">Features</h2><FlagToggles flags={flags} /></section>
      <section><h2 className="mb-3 text-lg font-bold">Shop search</h2><SearchIndexPanel status={index} /></section>
      <section><h2 className="mb-3 text-lg font-bold">Community</h2><CommunityForm community={community} now={requestTime()} /></section>
      <section><h2 className="mb-3 text-lg font-bold">Alert banner</h2><BannerForm banner={banner} /></section>
      <section><h2 className="mb-3 text-lg font-bold">Video</h2><MediaForms youtube={youtube} video={video} /></section>
      <section aria-labelledby="service-keys"><h2 id="service-keys" className="mb-3 text-lg font-bold">Service keys</h2><ServiceKeysPanel keys={serviceKeys} /></section>
    </div>
  );
}

export default function AdminSitePage() {
  return (
    <>
      <PageHeader title="Site settings" />
      <Suspense fallback={<Skeleton className="h-96" />}>
        <Settings />
      </Suspense>
    </>
  );
}
