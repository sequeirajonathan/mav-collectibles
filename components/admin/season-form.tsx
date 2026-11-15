"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { Button } from "@components/ui/button";
import { Field, inputClass } from "@components/ui/field";
import { createSeason } from "@lib/actions/hub";
import type { Game } from "@lib/contracts/hub";
import { cardVariants } from "@components/ui/card";
import { cn } from "@utils";

export function SeasonForm({ games }: { games: Game[] }) {
  const router = useRouter();
  const [v, setV] = useState({ gameId: "pokemon", name: "", startsOn: "", endsOn: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setErrors({});
        startTransition(async () => {
          const result = await createSeason(v);
          if (!result.ok) {
            setErrors(result.fieldErrors ?? {});
            return void toast.error(result.error);
          }
          toast.success("Season created");
          setV((cur) => ({ ...cur, name: "", startsOn: "", endsOn: "" }));
          router.refresh();
        });
      }}
      className={cn(cardVariants({ padding: "md" }), "grid gap-4 fold:grid-cols-2 lg:grid-cols-4")}
    >
      <Field label="Game" error={errors.gameId}>
        {(id) => (
          <select id={id} className={inputClass} value={v.gameId} onChange={(e) => setV({ ...v, gameId: e.target.value })}>
            {games.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        )}
      </Field>
      <Field label="Name" hint="e.g. Winter 2026 League" error={errors.name}>
        {(id) => <input id={id} className={inputClass} value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} required />}
      </Field>
      <Field label="Starts" error={errors.startsOn}>
        {(id) => <input id={id} type="date" className={inputClass} value={v.startsOn} onChange={(e) => setV({ ...v, startsOn: e.target.value })} required />}
      </Field>
      <Field label="Ends" error={errors.endsOn}>
        {(id) => <input id={id} type="date" className={inputClass} value={v.endsOn} onChange={(e) => setV({ ...v, endsOn: e.target.value })} required />}
      </Field>
      <div className="fold:col-span-2 lg:col-span-4">
        <Button type="submit" variant="gold" disabled={pending}>Create season</Button>
      </div>
    </form>
  );
}
