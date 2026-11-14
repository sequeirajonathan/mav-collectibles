"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { Download, Trash2 } from "lucide-react";
import { Button } from "@components/ui/button";
import { Field, inputClass } from "@components/hub/form";
import { addInstaller, deleteInstaller } from "@lib/actions/site";
import type { Installer } from "@lib/contracts/site";
import { formatShortDate } from "@lib/format";

export function Installers({ installers }: { installers: Installer[] }) {
  const router = useRouter();
  const [v, setV] = useState({ name: "MAV Print Agent", url: "" });
  const [pending, startTransition] = useTransition();
  return (
    <div className="space-y-6">
      <form
        className="grid gap-4 rounded-xl border border-line bg-panel p-4 fold:grid-cols-[1fr_2fr_auto] fold:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          startTransition(async () => {
            const result = await addInstaller(v);
            if (!result.ok) return void toast.error(Object.values(result.fieldErrors ?? {})[0] ?? result.error);
            setV({ ...v, url: "" });
            router.refresh();
          });
        }}
      >
        <Field label="Name">{(id) => <input id={id} className={inputClass} value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} />}</Field>
        <Field label="GitHub release URL" hint="Published by the mav-print release workflow">{(id) => <input id={id} type="url" className={inputClass} value={v.url} onChange={(e) => setV({ ...v, url: e.target.value })} required />}</Field>
        <Button type="submit" variant="gold" disabled={pending}>Add</Button>
      </form>
      <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-panel">
        {installers.length === 0 && <li className="p-4 text-sm text-muted-foreground">No installers yet.</li>}
        {installers.map((i) => (
          <li key={i.id} className="flex items-center gap-3 p-3">
            <a href={i.url} className="inline-flex min-w-0 flex-1 items-center gap-2 font-semibold hover:text-gold" target="_blank" rel="noopener noreferrer">
              <Download className="size-4 shrink-0" />
              <span className="truncate">{i.name}</span>
            </a>
            <span className="text-xs text-muted-foreground">{formatShortDate(i.createdAt)}</span>
            <button
              type="button"
              onClick={() => startTransition(async () => { const r = await deleteInstaller({ id: i.id }); if (!r.ok) toast.error(r.error); router.refresh(); })}
              className="inline-flex size-11 items-center justify-center rounded-md text-muted-foreground hover:text-danger"
              aria-label={`Delete ${i.name}`}
            >
              <Trash2 className="size-4" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
