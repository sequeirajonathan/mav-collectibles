"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { Trash2 } from "lucide-react";
import { Button } from "@components/ui/button";
import { addComment, deleteComment } from "@lib/actions/hub";
import type { Comment } from "@lib/contracts/hub";
import { formatShortDate } from "@lib/format";

export function Comments({
  postId,
  comments,
  viewerId,
  canModerate,
}: {
  postId: string;
  comments: Comment[];
  viewerId: string | null;
  canModerate: boolean;
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const textarea = useRef<HTMLTextAreaElement>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await addComment({ postId, body });
      if (!result.ok) {
        setError(result.fieldErrors?.body ?? result.error);
        return;
      }
      setBody("");
      router.refresh();
    });
  };

  const remove = (commentId: string) =>
    startTransition(async () => {
      const result = await deleteComment({ commentId });
      if (!result.ok) toast.error(result.error);
      else router.refresh();
    });

  return (
    <section aria-labelledby="comments-heading" className="mt-8">
      <h2 id="comments-heading" className="text-lg font-bold">
        Comments <span className="text-muted-foreground">({comments.length})</span>
      </h2>

      {viewerId ? (
        <form onSubmit={submit} className="mt-4">
          <label htmlFor="comment" className="sr-only">
            Write a comment
          </label>
          <textarea
            id="comment"
            ref={textarea}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={2000}
            rows={3}
            placeholder="Say something nice…"
            className="w-full resize-y rounded-lg border border-line bg-panel-2 px-3 py-2 text-base text-foreground placeholder:text-muted-foreground focus:border-gold"
          />
          {error && (
            <p role="alert" className="mt-1 text-sm text-danger">
              {error}
            </p>
          )}
          <div className="mt-2 flex justify-end">
            <Button type="submit" variant="gold" size="sm" disabled={pending || body.trim().length === 0}>
              Post comment
            </Button>
          </div>
        </form>
      ) : (
        <p className="mt-4 rounded-lg border border-line bg-panel px-4 py-3 text-sm text-muted-foreground">
          <Link href="/sign-in" className="font-semibold text-gold hover:text-gold-light">
            Sign in
          </Link>{" "}
          to join the conversation.
        </p>
      )}

      <ul className="mt-6 space-y-4">
        {comments.map((c) => (
          <li key={c.id} className="rounded-lg border border-line bg-panel px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm">
                <span className="font-semibold text-foreground">{c.authorName}</span>{" "}
                <span className="text-muted-foreground">· {formatShortDate(c.createdAt)}</span>
              </p>
              {(c.authorId === viewerId || canModerate) && (
                <button
                  type="button"
                  onClick={() => remove(c.id)}
                  disabled={pending}
                  className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-panel-2 hover:text-danger"
                  aria-label="Delete comment"
                >
                  <Trash2 className="size-4" />
                </button>
              )}
            </div>
            <p className="mt-1 whitespace-pre-line text-sm text-foreground/90">{c.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
