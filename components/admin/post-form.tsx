"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { Button } from "@components/ui/button";
import { Field, inputClass } from "@components/hub/form";
import { ImageUpload } from "./image-upload";
import { ConfirmButton } from "./confirm-button";
import { createPost, deletePost, updatePost } from "@lib/actions/hub";
import type { Game } from "@lib/contracts/hub";

export interface PostFormValues {
  title: string;
  body: string;
  imageUrl: string | null;
  gameId: string;
  eventId: string;
  pinned: boolean;
  status: "draft" | "published";
}

export function PostForm({
  postId,
  initial,
  games,
  events,
}: {
  postId?: string;
  initial: PostFormValues;
  games: Game[];
  events: { id: string; title: string }[];
}) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();
  const set = <K extends keyof PostFormValues>(k: K, value: PostFormValues[K]) => setV((cur) => ({ ...cur, [k]: value }));

  const save = (status: "draft" | "published") => {
    setErrors({});
    startTransition(async () => {
      const values = { ...v, status };
      const result = postId ? await updatePost({ id: postId, values }) : await createPost(values);
      if (!result.ok) {
        setErrors(Object.fromEntries(Object.entries(result.fieldErrors ?? {}).map(([k, m]) => [k.replace(/^values\./, ""), m])));
        toast.error(result.error);
        return;
      }
      toast.success(status === "published" ? "Published" : "Draft saved");
      router.push("/admin/posts");
      router.refresh();
    });
  };

  const remove = () =>
    postId &&
    startTransition(async () => {
      const result = await deletePost({ id: postId });
      if (!result.ok) return void toast.error(result.error);
      router.push("/admin/posts");
      router.refresh();
    });

  return (
    <form onSubmit={(e) => { e.preventDefault(); save("published"); }} className="space-y-6">
      <Field label="Headline" error={errors.title}>
        {(id) => <input id={id} className={inputClass} value={v.title} onChange={(e) => set("title", e.target.value)} required />}
      </Field>
      <Field label="Post" hint="Plain text. Line breaks are kept." error={errors.body}>
        {(id) => <textarea id={id} rows={10} className={inputClass} value={v.body} onChange={(e) => set("body", e.target.value)} />}
      </Field>
      <ImageUpload folder="posts" value={v.imageUrl} onChange={(url) => set("imageUrl", url)} />
      <div className="grid gap-5 fold:grid-cols-2">
        <Field label="Game" error={errors.gameId}>
          {(id) => (
            <select id={id} className={inputClass} value={v.gameId} onChange={(e) => set("gameId", e.target.value)}>
              <option value="">None</option>
              {games.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          )}
        </Field>
        <Field label="Link an event" hint="Shows a card that links to the event" error={errors.eventId}>
          {(id) => (
            <select id={id} className={inputClass} value={v.eventId} onChange={(e) => set("eventId", e.target.value)}>
              <option value="">None</option>
              {events.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
            </select>
          )}
        </Field>
      </div>
      <label className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold">
        <input type="checkbox" className="size-5 accent-[var(--gold)]" checked={v.pinned} onChange={(e) => set("pinned", e.target.checked)} />
        Pin to the top of the feed
      </label>
      <div className="flex flex-col gap-2 fold:flex-row fold:flex-wrap">
        <Button type="submit" variant="gold" disabled={pending}>{initial.status === "published" ? "Update" : "Publish"}</Button>
        <Button type="button" variant="outline" disabled={pending} onClick={() => save("draft")}>
          {initial.status === "published" ? "Unpublish (save as draft)" : "Save draft"}
        </Button>
        {postId && <ConfirmButton label="Delete" confirmLabel="Delete forever" onConfirm={remove} disabled={pending} />}
      </div>
    </form>
  );
}
