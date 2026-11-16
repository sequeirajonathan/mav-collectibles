"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { CheckCircle2, CircleAlert, Copy } from "lucide-react";
import { Button } from "@components/ui/button";
import { cardVariants } from "@components/ui/card";
import { Field, inputClass } from "@components/ui/field";
import { registerDiscordCommands, saveDiscordSettings, sendDiscordTest } from "@lib/actions/discord";
import type { DiscordSettings } from "@lib/discord/core";
import { cn } from "@utils";

const TOGGLES = [
  { key: "announceEvents", label: "New events", help: "Post in the announcements channel when an event is published." },
  { key: "announceReminders", label: "Day-before reminders", help: "Post once a day about events starting in the next 24 hours." },
  { key: "announceResults", label: "Champions", help: "Congratulate the winner when a bracket finishes." },
  { key: "staffAlerts", label: "Staff alerts", help: "Tell the staff channel about new requests, job and vendor applications." },
] as const;

/** Everything an admin needs to connect the shop's Discord bot, in the order they'll do it. */
export function DiscordPanel({ settings, hasToken, interactionsUrl, commandCount }: { settings: DiscordSettings; hasToken: boolean; interactionsUrl: string; commandCount: number }) {
  const router = useRouter();
  const [v, setV] = useState({
    applicationId: settings.applicationId ?? "",
    publicKey: settings.publicKey ?? "",
    guildId: settings.guildId ?? "",
    announceChannelId: settings.announceChannelId ?? "",
    staffChannelId: settings.staffChannelId ?? "",
    announceEvents: settings.announceEvents,
    announceReminders: settings.announceReminders,
    announceResults: settings.announceResults,
    staffAlerts: settings.staffAlerts,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();
  const set = <K extends keyof typeof v>(key: K, value: (typeof v)[K]) => setV((cur) => ({ ...cur, [key]: value }));

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    startTransition(async () => {
      const result = await saveDiscordSettings(v);
      if (!result.ok) {
        setErrors(result.fieldErrors ?? {});
        return void toast.error(result.error);
      }
      toast.success("Discord settings saved");
      router.refresh();
    });
  };

  const run = (action: () => Promise<{ ok: true } | { ok: false; error: string }>, success: string) =>
    startTransition(async () => {
      const result = await action();
      if (!result.ok) return void toast.error(result.error, { duration: 8000 });
      toast.success(success);
      router.refresh();
    });

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(interactionsUrl);
      toast.success("Copied");
    } catch {
      window.prompt("Copy this address", interactionsUrl);
    }
  };

  const ready = hasToken && Boolean(settings.applicationId && settings.publicKey && settings.guildId);
  const step = (done: boolean, text: string) => (
    <li className="flex gap-2">
      {done ? <CheckCircle2 aria-hidden className="mt-0.5 size-4 shrink-0 text-success" /> : <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />}
      <span className={done ? "text-muted-foreground" : ""}>{text}</span>
    </li>
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,24rem)_1fr] lg:items-start">
      <div className={cn(cardVariants({ padding: "md" }), "space-y-3")}>
        <h3 className="font-bold">Setup checklist</h3>
        <ol className="space-y-2 text-sm">
          {step(Boolean(settings.applicationId && settings.publicKey), "Create an application at discord.com/developers and paste its Application ID and Public Key here.")}
          {step(hasToken, "On its Bot page, reset the token and save it under Service keys below (“Discord bot”).")}
          {step(Boolean(settings.guildId), "Invite the bot to the server with the “bot” and “applications.commands” scopes, then paste the Server ID.")}
          {step(Boolean(settings.announceChannelId), "Paste the channel IDs the bot should post in. It needs permission to view and send messages there.")}
          {step(Boolean(settings.commandsRegisteredAt), "Save, then press “Register slash commands”.")}
          <li className="flex gap-2">
            <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <span>
              Last, in the Developer Portal paste this as the <strong>Interactions Endpoint URL</strong>. Discord checks it on the spot, so the Public Key must be saved here first.
            </span>
          </li>
        </ol>
        <div className="flex items-center gap-2 rounded-lg border border-line bg-panel-2 p-2">
          <code className="min-w-0 flex-1 break-all text-xs">{interactionsUrl}</code>
          <Button type="button" variant="ghost" size="icon" aria-label="Copy the interactions address" onClick={copy}>
            <Copy />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">To copy IDs in Discord, turn on Settings → Advanced → Developer Mode, then right-click a server or channel and choose Copy ID.</p>
      </div>

      <form onSubmit={save} className={cn(cardVariants({ padding: "md" }), "space-y-5")}>
        <div className="grid gap-5 fold:grid-cols-2">
          <Field label="Application ID" error={errors.applicationId}>
            {(id) => <input id={id} className={inputClass} inputMode="numeric" autoComplete="off" value={v.applicationId} onChange={(e) => set("applicationId", e.target.value)} />}
          </Field>
          <Field label="Server ID" error={errors.guildId}>
            {(id) => <input id={id} className={inputClass} inputMode="numeric" autoComplete="off" value={v.guildId} onChange={(e) => set("guildId", e.target.value)} />}
          </Field>
        </div>
        <Field label="Public Key" hint="From the application's General Information page. Not a secret." error={errors.publicKey}>
          {(id) => <input id={id} className={inputClass} autoComplete="off" spellCheck={false} autoCapitalize="none" value={v.publicKey} onChange={(e) => set("publicKey", e.target.value)} />}
        </Field>
        <div className="grid gap-5 fold:grid-cols-2">
          <Field label="Announcements channel ID" hint="Events, reminders and champions" error={errors.announceChannelId}>
            {(id) => <input id={id} className={inputClass} inputMode="numeric" autoComplete="off" value={v.announceChannelId} onChange={(e) => set("announceChannelId", e.target.value)} />}
          </Field>
          <Field label="Staff channel ID" hint="A private channel for staff alerts" error={errors.staffChannelId}>
            {(id) => <input id={id} className={inputClass} inputMode="numeric" autoComplete="off" value={v.staffChannelId} onChange={(e) => set("staffChannelId", e.target.value)} />}
          </Field>
        </div>
        <fieldset>
          <legend className="text-sm font-semibold">What the bot posts</legend>
          <div className="mt-2 grid gap-2 fold:grid-cols-2">
            {TOGGLES.map((t) => (
              <label key={t.key} className="flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border border-line p-3 has-[:checked]:border-gold">
                <input type="checkbox" className="mt-0.5 size-5 shrink-0 accent-[var(--gold)]" checked={v[t.key]} onChange={(e) => set(t.key, e.target.checked)} />
                <span>
                  <span className="block font-semibold">{t.label}</span>
                  <span className="text-sm text-muted-foreground">{t.help}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" variant="gold" disabled={pending}>
            Save Discord settings
          </Button>
          <Button type="button" variant="outline" disabled={pending || !ready} onClick={() => run(() => registerDiscordCommands({}), `${commandCount} slash commands registered`)}>
            Register slash commands
          </Button>
          <Button type="button" variant="outline" disabled={pending || !hasToken || !settings.announceChannelId} onClick={() => run(() => sendDiscordTest({ channel: "announce" }), "Posted in the announcements channel")}>
            Test announcements
          </Button>
          <Button type="button" variant="outline" disabled={pending || !hasToken || !settings.staffChannelId} onClick={() => run(() => sendDiscordTest({ channel: "staff" }), "Posted in the staff channel")}>
            Test staff channel
          </Button>
        </div>
        {settings.commandsRegisteredAt && <p className="text-xs text-muted-foreground">Slash commands last registered {new Date(settings.commandsRegisteredAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}.</p>}
      </form>
    </div>
  );
}
