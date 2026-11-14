"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, Loader2, X } from "lucide-react";
import { getBrowserClient } from "@utils/supabase/client";

const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

/** Uploads to the public `images` bucket (staff-only by RLS) and returns the public URL. */
export function ImageUpload({ value, onChange, folder, label = "Image" }: { value: string | null; onChange: (url: string | null) => void; folder: string; label?: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File) => {
    setError(null);
    if (!TYPES.includes(file.type)) return setError("Use a JPG, PNG, WebP or GIF image.");
    if (file.size > MAX_BYTES) return setError("Images must be 5 MB or smaller.");
    setBusy(true);
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const path = `${folder}/${crypto.randomUUID()}.${ext}`;
    const supabase = await getBrowserClient();
    const { error: uploadError } = await supabase.storage.from("images").upload(path, file, { contentType: file.type, cacheControl: "31536000" });
    setBusy(false);
    if (uploadError) return setError(uploadError.message);
    onChange(supabase.storage.from("images").getPublicUrl(path).data.publicUrl);
  };

  return (
    <div>
      <p className="text-sm font-semibold">{label}</p>
      <div className="mt-1.5 flex items-center gap-3">
        <div className="relative aspect-[16/9] w-40 shrink-0 overflow-hidden rounded-lg border border-line bg-panel-2">
          {value ? <Image src={value} alt="" fill sizes="160px" className="object-cover" /> : <span className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">No image</span>}
        </div>
        <div className="flex flex-col gap-2">
          <button type="button" onClick={() => input.current?.click()} disabled={busy} className="inline-flex min-h-10 items-center gap-2 rounded-md border border-line px-3 text-sm font-semibold hover:border-gold/60">
            {busy ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
            {value ? "Replace" : "Upload"}
          </button>
          {value && (
            <button type="button" onClick={() => onChange(null)} className="inline-flex min-h-10 items-center gap-2 rounded-md px-3 text-sm text-muted-foreground hover:text-danger">
              <X className="size-4" /> Remove
            </button>
          )}
        </div>
      </div>
      <input ref={input} type="file" accept={TYPES.join(",")} className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); e.target.value = ""; }} />
      {error && <p role="alert" className="mt-1 text-sm text-danger">{error}</p>}
    </div>
  );
}
