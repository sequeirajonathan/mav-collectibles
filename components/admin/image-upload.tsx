"use client";

import { Button } from "@components/ui/button";
import { cardVariants } from "@components/ui/card";
import { cn } from "@utils";
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
        <div className={cn(cardVariants({ variant: "inset", radius: "lg" }), "relative aspect-[16/9] w-40 shrink-0 overflow-hidden")}>
          {value ? <Image src={value} alt="" fill sizes="160px" className="object-cover" /> : <span className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">No image</span>}
        </div>
        <div className="flex flex-col gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => input.current?.click()} disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
            {value ? "Replace" : "Upload"}
          </Button>
          {value && (
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)} className="font-normal text-muted-foreground hover:text-danger">
              <X className="size-4" /> Remove
            </Button>
          )}
        </div>
      </div>
      <input ref={input} type="file" accept={TYPES.join(",")} className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); e.target.value = ""; }} />
      {error && <p role="alert" className="mt-1 text-sm text-danger">{error}</p>}
    </div>
  );
}
