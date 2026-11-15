"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import Image from "next/image";
import { toast } from "react-hot-toast";
import { ImagePlus, Loader2, SendHorizontal, Trash2, X } from "lucide-react";
import { Button } from "@components/ui/button";
import { cardVariants } from "@components/ui/card";
import { inputClass } from "@components/ui/field";
import { deleteStaffMessage, sendStaffMessage } from "@lib/actions/chat";
import { CHAT_IMAGE_MAX_BYTES, CHAT_IMAGE_TYPES, chatListSchema, uploadResponseSchema, type ChatMessage } from "@lib/contracts/chat";
import { cn } from "@utils";

const POLL_MS = 5000;
const time = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

export function StaffChat({ initial, userId, isAdmin }: { initial: ChatMessage[]; userId: string; isAdmin: boolean }) {
  const [messages, setMessages] = useState(initial);
  const [body, setBody] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const list = useRef<HTMLDivElement>(null);
  const picker = useRef<HTMLInputElement>(null);
  const latest = useRef(initial.at(-1)?.createdAt);

  const merge = useCallback((incoming: ChatMessage[]) => {
    if (incoming.length === 0) return;
    setMessages((current) => {
      const known = new Set(current.map((m) => m.id));
      const fresh = incoming.filter((m) => !known.has(m.id));
      return fresh.length ? [...current, ...fresh] : current;
    });
    latest.current = incoming.at(-1)?.createdAt ?? latest.current;
  }, []);

  const refresh = useCallback(async () => {
    try {
      const query = latest.current ? `?after=${encodeURIComponent(latest.current)}` : "";
      const response = await fetch(`/api/v1/staff-chat${query}`, { cache: "no-store" });
      if (!response.ok) return;
      merge(chatListSchema.parse(await response.json()).messages);
    } catch {
      // Offline or mid-deploy: the next tick tries again.
    }
  }, [merge]);

  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    const timer = setInterval(tick, POLL_MS);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [refresh]);

  // Keep the newest message in view.
  useEffect(() => {
    list.current?.scrollTo({ top: list.current.scrollHeight });
  }, [messages.length]);

  const attach = (picked: File | undefined) => {
    if (!picked) return;
    if (!(picked.type in CHAT_IMAGE_TYPES)) return void toast.error("Pictures must be JPG, PNG, GIF or WebP.");
    if (picked.size > CHAT_IMAGE_MAX_BYTES) return void toast.error("Pictures must be 4 MB or smaller.");
    if (preview) URL.revokeObjectURL(preview);
    setFile(picked);
    setPreview(URL.createObjectURL(picked));
  };
  const clearFile = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    if (picker.current) picker.current.value = "";
  };

  const send = async (e?: FormEvent) => {
    e?.preventDefault();
    if (sending || (!body.trim() && !file)) return;
    setSending(true);
    try {
      let imagePath: string | null = null;
      if (file) {
        const data = new FormData();
        data.set("image", file);
        const upload = await fetch("/api/v1/staff-chat/upload", { method: "POST", body: data });
        if (!upload.ok) return void toast.error("We couldn't upload that picture. Please try again.");
        imagePath = uploadResponseSchema.parse(await upload.json()).path;
      }
      const result = await sendStaffMessage({ body, imagePath });
      if (!result.ok) return void toast.error(result.error);
      setBody("");
      clearFile();
      await refresh();
    } finally {
      setSending(false);
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter sends on a keyboard; Shift+Enter makes a new line.
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void send();
    }
  };

  const remove = async (id: string) => {
    const result = await deleteStaffMessage({ id });
    if (!result.ok) return void toast.error(result.error);
    setMessages((current) => current.filter((m) => m.id !== id));
  };

  return (
    <div className={cn(cardVariants(), "flex h-[min(70dvh,44rem)] flex-col overflow-hidden")}>
      <div ref={list} role="log" aria-label="Messages" aria-live="polite" className="flex-1 space-y-3 overflow-y-auto p-3 fold:p-4">
        {messages.length === 0 && (
          <div className="py-10 text-center text-muted-foreground">
            <Image src="/images/lucario.gif" alt="" width={47} height={63} unoptimized className="pixelated animate-bob mx-auto mb-3 h-24 w-auto" />
            No messages yet. Say hi to the team.
          </div>
        )}
        {messages.map((m) => {
          const mine = m.authorId === userId;
          return (
            <div key={m.id} className={cn("group flex flex-col", mine ? "items-end" : "items-start")}>
              <p className="mb-0.5 px-1 text-xs text-muted-foreground">
                {mine ? "You" : m.authorName} · {time.format(new Date(m.createdAt))}
              </p>
              <div className="flex max-w-[85%] items-end gap-1 fold:max-w-[70%]">
                <div className={cn("min-w-0 rounded-2xl px-3 py-2", mine ? "bg-gold text-ink" : "bg-panel-2 text-foreground")}>
                  {m.hasImage && (
                    // Served through a signed redirect, so the optimizer can't fetch it.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`/api/v1/staff-chat/image/${m.id}`} alt="Picture" loading="lazy" className="max-h-80 rounded-lg" />
                  )}
                  {m.body && <p className={cn("whitespace-pre-wrap break-words", m.hasImage && "mt-2")}>{m.body}</p>}
                </div>
                {(mine || isAdmin) && (
                  <button
                    type="button"
                    onClick={() => void remove(m.id)}
                    aria-label="Delete message"
                    className="inline-flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:text-danger can-hover:opacity-0 can-hover:focus-visible:opacity-100 can-hover:group-hover:opacity-100"
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <form onSubmit={send} className="border-t border-line p-3">
        {preview && (
          <div className="relative mb-2 inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Picture to send" className="h-24 rounded-lg border border-line" />
            <button type="button" onClick={clearFile} aria-label="Remove picture" className="absolute -right-2 -top-2 inline-flex size-7 items-center justify-center rounded-full border border-line bg-panel text-foreground">
              <X className="size-4" />
            </button>
          </div>
        )}
        <div className="flex items-end gap-2">
          <input ref={picker} type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => attach(e.target.files?.[0])} />
          <Button type="button" variant="outline" size="icon" aria-label="Attach a photo or GIF" onClick={() => picker.current?.click()} disabled={sending}>
            <ImagePlus className="size-5" />
          </Button>
          <label htmlFor="chat-message" className="sr-only">
            Message
          </label>
          <textarea
            id="chat-message"
            rows={1}
            maxLength={4000}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Message the team"
            className={cn(inputClass, "max-h-40 min-h-11 flex-1 resize-none")}
          />
          <Button type="submit" size="icon" aria-label="Send" disabled={sending || (!body.trim() && !file)}>
            {sending ? <Loader2 className="size-5 animate-spin" /> : <SendHorizontal className="size-5" />}
          </Button>
        </div>
      </form>
    </div>
  );
}
