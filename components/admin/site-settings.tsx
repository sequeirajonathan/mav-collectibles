"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { Button } from "@components/ui/button";
import { Switch } from "@components/ui/switch";
import { Field, inputClass } from "@components/hub/form";
import { saveAlertBanner, saveCommunity, saveVideoSettings, saveYouTubeSettings, setFlag } from "@lib/actions/site";
import type { AlertBanner, Community, FlagName, VideoSettings, YouTubeSettings } from "@lib/contracts/site";

const FLAG_HELP: Record<FlagName, { label: string; help: string }> = {
  shopLive: { label: "Online shop is live", help: "Off: customers browse the shop as an in-store showcase with no cart. Staff always see the full shop." },
  showAlertBanner: { label: "Show alert banner", help: "The strip at the very top of every page." },
  showYouTubeVideo: { label: "Show YouTube video", help: "Featured video on the home page." },
  showVideoPlayer: { label: "Show live stream", help: "HLS live stream on the home page." },
  showGoogleReviews: { label: "Show Google reviews", help: "Recent 4–5 star reviews on the home page." },
};

export function FlagToggles({ flags }: { flags: { name: FlagName; enabled: boolean }[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-panel">
      {flags.map((f) => (
        <li key={f.name} className="flex items-center justify-between gap-4 p-4">
          <div>
            <p className="font-semibold">{FLAG_HELP[f.name].label}</p>
            <p className="text-sm text-muted-foreground">{FLAG_HELP[f.name].help}</p>
          </div>
          <Switch
            checked={f.enabled}
            disabled={pending}
            aria-label={FLAG_HELP[f.name].label}
            onCheckedChange={(enabled) =>
              startTransition(async () => {
                const result = await setFlag({ name: f.name, enabled });
                if (!result.ok) return void toast.error(result.error);
                toast.success(`${FLAG_HELP[f.name].label}: ${enabled ? "on" : "off"}`);
                router.refresh();
              })
            }
          />
        </li>
      ))}
    </ul>
  );
}

export function BannerForm({ banner }: { banner: AlertBanner | null }) {
  const [v, setV] = useState({
    message: banner?.message ?? "",
    code: banner?.code ?? "",
    backgroundColor: banner?.backgroundColor ?? "#E6B325",
    textColor: banner?.textColor ?? "#000000",
    enabled: banner?.enabled ?? true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const result = await saveAlertBanner(v);
          setErrors(result.ok ? {} : (result.fieldErrors ?? {}));
          if (result.ok) toast.success("Banner saved");
          else toast.error(result.error);
        });
      }}
      className="space-y-4 rounded-xl border border-line bg-panel p-4"
    >
      <div className="rounded-md px-3 py-2 text-center text-sm font-medium" style={{ backgroundColor: v.backgroundColor, color: v.textColor }}>
        {v.message || "Preview"} {v.code && <strong className="ml-1">{v.code}</strong>}
      </div>
      <Field label="Message" error={errors.message}>{(id) => <input id={id} className={inputClass} value={v.message} onChange={(e) => setV({ ...v, message: e.target.value })} />}</Field>
      <div className="grid gap-4 fold:grid-cols-3">
        <Field label="Code (optional)" error={errors.code}>{(id) => <input id={id} className={inputClass} value={v.code} onChange={(e) => setV({ ...v, code: e.target.value })} />}</Field>
        <Field label="Background" error={errors.backgroundColor}>{(id) => <input id={id} type="color" className="h-11 w-full rounded-lg border border-line bg-panel-2" value={v.backgroundColor} onChange={(e) => setV({ ...v, backgroundColor: e.target.value.toUpperCase() })} />}</Field>
        <Field label="Text" error={errors.textColor}>{(id) => <input id={id} type="color" className="h-11 w-full rounded-lg border border-line bg-panel-2" value={v.textColor} onChange={(e) => setV({ ...v, textColor: e.target.value.toUpperCase() })} />}</Field>
      </div>
      <label className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold">
        <input type="checkbox" className="size-5 accent-[var(--gold)]" checked={v.enabled} onChange={(e) => setV({ ...v, enabled: e.target.checked })} />
        Enabled
      </label>
      <div><Button type="submit" variant="gold" disabled={pending}>Save banner</Button></div>
    </form>
  );
}

export function MediaForms({ youtube, video }: { youtube: YouTubeSettings | null; video: VideoSettings | null }) {
  const [yt, setYt] = useState(youtube ?? { videoId: "", title: "Featured video", autoplay: false, muted: true, playlistId: "" });
  const [vid, setVid] = useState(video ?? { src: "", type: "application/x-mpegURL", isLive: false, poster: "", title: "Live stream", autoplay: true, muted: true });
  const [pending, startTransition] = useTransition();
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <form
        className="space-y-4 rounded-xl border border-line bg-panel p-4"
        onSubmit={(e) => {
          e.preventDefault();
          startTransition(async () => {
            const result = await saveYouTubeSettings(yt);
            if (result.ok) toast.success("YouTube video saved");
            else toast.error(Object.values(result.fieldErrors ?? {})[0] ?? result.error);
          });
        }}
      >
        <h3 className="font-bold">YouTube video</h3>
        <Field label="Video ID" hint="From youtube.com/watch?v=THIS_PART">{(id) => <input id={id} className={inputClass} value={yt.videoId} onChange={(e) => setYt({ ...yt, videoId: e.target.value })} />}</Field>
        <Field label="Title">{(id) => <input id={id} className={inputClass} value={yt.title} onChange={(e) => setYt({ ...yt, title: e.target.value })} />}</Field>
        <Button type="submit" variant="gold" disabled={pending}>Save</Button>
      </form>
      <form
        className="space-y-4 rounded-xl border border-line bg-panel p-4"
        onSubmit={(e) => {
          e.preventDefault();
          startTransition(async () => {
            const result = await saveVideoSettings(vid);
            if (result.ok) toast.success("Stream saved");
            else toast.error(Object.values(result.fieldErrors ?? {})[0] ?? result.error);
          });
        }}
      >
        <h3 className="font-bold">Live stream</h3>
        <Field label="Stream URL (.m3u8)">{(id) => <input id={id} type="url" className={inputClass} value={vid.src} onChange={(e) => setVid({ ...vid, src: e.target.value })} />}</Field>
        <Field label="Title">{(id) => <input id={id} className={inputClass} value={vid.title} onChange={(e) => setVid({ ...vid, title: e.target.value })} />}</Field>
        <label className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold">
          <input type="checkbox" className="size-5 accent-[var(--gold)]" checked={vid.isLive} onChange={(e) => setVid({ ...vid, isLive: e.target.checked })} />
          We&apos;re live
        </label>
        <div><Button type="submit" variant="gold" disabled={pending}>Save</Button></div>
      </form>
    </div>
  );
}

export function CommunityForm({ community, now }: { community: Community; now: number }) {
  const router = useRouter();
  const [discordUrl, setDiscordUrl] = useState(community.discordUrl ?? "");
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const expiresAt = community.expiresAt ? new Date(community.expiresAt) : null;
  const daysLeft = expiresAt ? Math.ceil((expiresAt.getTime() - now) / 86_400_000) : null;
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const result = await saveCommunity({ discordUrl });
          setError(result.ok ? undefined : (result.fieldErrors?.discordUrl ?? result.error));
          if (result.ok) {
            toast.success("Discord link saved");
            router.refresh();
          }
        });
      }}
      className="space-y-4 rounded-xl border border-line bg-panel p-4"
    >
      <Field label="Discord invite link" hint="Shown on the home page, events and the footer. Leave empty to hide." error={error}>
        {(id) => (
          <input id={id} className={inputClass} inputMode="url" autoCapitalize="none" placeholder="https://discord.gg/…" value={discordUrl} onChange={(e) => setDiscordUrl(e.target.value)} />
        )}
      </Field>
      {community.discordUrl && !community.valid && (
        <p role="alert" className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm">
          Discord says this invite no longer works, so it&apos;s hidden on the site. Paste a new one.
        </p>
      )}
      {daysLeft !== null && community.valid && (
        <p role="status" className="rounded-lg border border-gold/50 bg-gold/10 px-3 py-2 text-sm">
          This invite expires in <strong>{daysLeft} day{daysLeft === 1 ? "" : "s"}</strong>. In Discord, choose
          <em> Invite People → Edit invite link → Expire after: Never</em>, then paste the new link here.
        </p>
      )}
      {community.members !== null && (
        <p className="text-sm text-muted-foreground">
          {community.serverName ?? "Server"}: {community.members.toLocaleString()} members, {community.online?.toLocaleString() ?? "?"} online.
        </p>
      )}
      <div><Button type="submit" variant="gold" disabled={pending}>Save</Button></div>
    </form>
  );
}
