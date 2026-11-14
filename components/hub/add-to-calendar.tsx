"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarPlus, ChevronDown } from "lucide-react";
import { Button } from "@components/ui/button";

/** Google / Apple (.ics) / Outlook menu. Apple Calendar on iPhone opens .ics files directly. */
export function AddToCalendar({ googleUrl, outlookUrl, icsUrl }: { googleUrl: string; outlookUrl: string; icsUrl: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  const item = "block rounded-md px-3 py-2.5 text-sm text-foreground hover:bg-panel-2 focus-visible:bg-panel-2";

  return (
    <div ref={ref} className="relative w-full fold:w-auto">
      <Button variant="outline" className="w-full fold:w-auto" aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen((o) => !o)}>
        <CalendarPlus />
        Add to calendar
        <ChevronDown className="opacity-60" />
      </Button>
      {open && (
        <div role="menu" className="absolute left-0 right-0 z-20 mt-2 rounded-lg border border-line bg-panel p-1 shadow-xl fold:left-auto fold:w-56">
          <a role="menuitem" className={item} href={icsUrl}>
            Apple Calendar / iPhone
          </a>
          <a role="menuitem" className={item} href={googleUrl} target="_blank" rel="noopener noreferrer">
            Google Calendar
          </a>
          <a role="menuitem" className={item} href={outlookUrl} target="_blank" rel="noopener noreferrer">
            Outlook
          </a>
          <a role="menuitem" className={item} href={icsUrl} download>
            Download .ics file
          </a>
        </div>
      )}
    </div>
  );
}
