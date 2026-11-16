"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { CheckCircle2, CircleAlert, KeyRound } from "lucide-react";
import { Button } from "@components/ui/button";
import { cardVariants } from "@components/ui/card";
import { inputClass } from "@components/ui/field";
import { ConfirmButton } from "@components/admin/confirm-button";
import { removeServiceKey, saveServiceKey } from "@lib/actions/site";
import type { ServiceKeyStatus } from "@lib/service-keys";
import { cn } from "@utils";

const when = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "");

function Row({ status }: { status: ServiceKeyStatus }) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const inputId = `key-${status.name}`;

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);
    startTransition(async () => {
      const saved = await saveServiceKey({ name: status.name, value });
      if (!saved.ok) return void setResult({ ok: false, message: saved.error });
      setValue("");
      setResult(saved.data.check ?? { ok: true, message: "Saved." });
      router.refresh();
    });
  };

  const remove = () =>
    startTransition(async () => {
      const removed = await removeServiceKey({ name: status.name });
      if (!removed.ok) return void toast.error(removed.error);
      setResult(null);
      toast.success(`${status.label} key removed`);
      router.refresh();
    });

  const state =
    status.source === "host"
      ? { text: "Set in the hosting settings", good: true }
      : status.source === "saved"
        ? { text: `Saved here ${when(status.updatedAt)}`, good: true }
        : status.source === "unreadable"
          ? { text: "Saved, but it can no longer be read. Enter it again.", good: false }
          : { text: "Not set", good: false };

  return (
    <li className="space-y-3 p-4">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
        <div className="min-w-0">
          <h3 className="font-bold">{status.label}</h3>
          <p className="text-sm text-muted-foreground">{status.purpose}</p>
        </div>
        <p className={cn("inline-flex items-center gap-1.5 text-sm font-semibold", state.good ? "text-success" : "text-muted-foreground")}>
          {state.good ? <CheckCircle2 aria-hidden className="size-4" /> : <CircleAlert aria-hidden className="size-4" />}
          {state.text}
        </p>
      </div>
      {status.source === "host" ? (
        <p className="text-xs text-muted-foreground">The hosting setting is used. Change it there, or remove it there to manage this key here.</p>
      ) : (
        <form onSubmit={save} className="space-y-2">
          <label htmlFor={inputId} className="text-sm font-semibold">
            {status.source === "saved" ? "Replace the key" : "Paste the key"}
          </label>
          <p className="text-xs text-muted-foreground">
            {status.where} {status.hint}.
          </p>
          <div className="flex flex-col gap-2 fold:flex-row">
            {/* Never filled in from the server: a saved key can be replaced or removed, not viewed. */}
            <input id={inputId} type="password" className={inputClass} value={value} onChange={(e) => setValue(e.target.value)} autoComplete="off" spellCheck={false} autoCapitalize="none" />
            <Button type="submit" variant="gold" disabled={pending || !value.trim()}>
              <KeyRound aria-hidden /> Save
            </Button>
            {status.source !== "none" && <ConfirmButton label="Remove" confirmLabel="Remove key" onConfirm={remove} disabled={pending} />}
          </div>
        </form>
      )}
      {result && (
        <p role="status" className={cn("text-sm font-semibold", result.ok ? "text-success" : "text-danger")}>
          {result.message}
        </p>
      )}
    </li>
  );
}

/** Admins enter keys for outside services here instead of in the hosting settings. */
export function ServiceKeysPanel({ keys }: { keys: ServiceKeyStatus[] }) {
  return (
    <div>
      <p className="mb-3 max-w-prose text-sm text-muted-foreground">
        Keys are stored encrypted and are never shown again after you save them. Only admins can see this section.
      </p>
      <ul className={cn(cardVariants({ variant: "list" }))}>
        {keys.map((k) => (
          <Row key={k.name} status={k} />
        ))}
      </ul>
    </div>
  );
}
