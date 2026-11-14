"use client";

import { useOptimistic, useTransition } from "react";
import Link from "next/link";
import { Bookmark, Heart, MessageCircle } from "lucide-react";
import { toast } from "react-hot-toast";
import { toggleLike, toggleSave } from "@lib/actions/hub";
import { cn } from "@utils";

interface ReactionState {
  liked: boolean;
  saved: boolean;
  likeCount: number;
}

export function ReactionBar({
  postId,
  initial,
  commentCount,
  signedIn,
  commentsHref,
}: {
  postId: string;
  initial: ReactionState;
  commentCount: number;
  signedIn: boolean;
  commentsHref: string;
}) {
  const [, startTransition] = useTransition();
  const [state, apply] = useOptimistic(initial, (current: ReactionState, change: Partial<ReactionState>) => ({ ...current, ...change }));

  const requireSignIn = () => {
    toast("Sign in to like and save posts", { icon: "🔒" });
  };

  const like = () => {
    if (!signedIn) return requireSignIn();
    const liked = !state.liked;
    startTransition(async () => {
      apply({ liked, likeCount: state.likeCount + (liked ? 1 : -1) });
      const result = await toggleLike({ postId, liked });
      if (!result.ok) toast.error(result.error);
    });
  };

  const save = () => {
    if (!signedIn) return requireSignIn();
    const saved = !state.saved;
    startTransition(async () => {
      apply({ saved });
      const result = await toggleSave({ postId, saved });
      if (!result.ok) toast.error(result.error);
      else if (saved) toast.success("Saved to your hub");
    });
  };

  const button = "inline-flex min-h-11 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors hover:bg-panel-2";

  return (
    <div className="flex items-center gap-1 text-muted-foreground">
      <button type="button" onClick={like} aria-pressed={state.liked} className={cn(button, state.liked && "text-danger")}>
        <Heart className={cn("size-5", state.liked && "fill-current")} />
        <span className="tabular-nums">{state.likeCount}</span>
        <span className="sr-only">likes</span>
      </button>
      <Link href={commentsHref} className={button}>
        <MessageCircle className="size-5" />
        <span className="tabular-nums">{commentCount}</span>
        <span className="sr-only">comments</span>
      </Link>
      <button type="button" onClick={save} aria-pressed={state.saved} className={cn(button, "ml-auto", state.saved && "text-gold")}>
        <Bookmark className={cn("size-5", state.saved && "fill-current")} />
        {state.saved ? "Saved" : "Save"}
      </button>
    </div>
  );
}
