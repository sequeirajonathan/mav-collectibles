"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { Bell, BellOff } from "lucide-react";
import { Button } from "@components/ui/button";
import { removePushSubscription, savePushSubscription } from "@lib/actions/chat";

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function keyBytes(base64Url: string): Uint8Array<ArrayBuffer> {
  const base64 = (base64Url + "=".repeat((4 - (base64Url.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

type State = "loading" | "unsupported" | "needs-install" | "off" | "on" | "blocked";

/** Turns notifications for this phone or computer on and off. */
export function PushToggle() {
  const [state, setState] = useState<State>("loading");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const check = async (): Promise<State> => {
      if (!PUBLIC_KEY) return "unsupported";
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
        // iPhones only offer notifications once the site is added to the Home Screen.
        const iOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
        return iOS ? "needs-install" : "unsupported";
      }
      if (Notification.permission === "denied") return "blocked";
      const registration = await navigator.serviceWorker.getRegistration();
      const existing = await registration?.pushManager.getSubscription();
      return existing ? "on" : "off";
    };
    void check()
      .catch((): State => "unsupported")
      .then((s) => {
        if (!cancelled) setState(s);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const turnOn = async () => {
    if (!PUBLIC_KEY) return;
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission === "denied" ? "blocked" : "off");
        return;
      }
      const registration = (await navigator.serviceWorker.getRegistration()) ?? (await navigator.serviceWorker.register("/sw.js", { scope: "/" }));
      await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(PUBLIC_KEY) });
      const json = subscription.toJSON();
      const result = await savePushSubscription({ endpoint: subscription.endpoint, keys: { p256dh: json.keys?.p256dh ?? "", auth: json.keys?.auth ?? "" } });
      if (!result.ok) {
        await subscription.unsubscribe();
        toast.error(result.error);
        return;
      }
      setState("on");
      toast.success("Notifications are on for this device");
    } catch {
      toast.error("Couldn't turn notifications on. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const turnOff = async () => {
    setBusy(true);
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        await removePushSubscription({ endpoint: subscription.endpoint });
        await subscription.unsubscribe();
      }
      setState("off");
    } finally {
      setBusy(false);
    }
  };

  if (state === "loading" || state === "unsupported") return null;
  if (state === "needs-install") {
    return <p className="text-sm text-muted-foreground">To get notifications on an iPhone, add this site to your Home Screen (Share → Add to Home Screen), then open it from there.</p>;
  }
  if (state === "blocked") {
    return <p className="text-sm text-muted-foreground">Notifications are blocked for this site. Allow them in your browser or phone settings to turn them on.</p>;
  }
  return state === "on" ? (
    <Button variant="outline" size="sm" onClick={turnOff} disabled={busy}>
      <BellOff aria-hidden /> Turn off notifications
    </Button>
  ) : (
    <Button size="sm" onClick={turnOn} disabled={busy}>
      <Bell aria-hidden /> Notify me on this device
    </Button>
  );
}
