"use client";

import { useState } from "react";
import { Button } from "@components/ui/button";

/** Two-step button for destructive actions. */
export function ConfirmButton({ label, confirmLabel = "Yes, do it", onConfirm, disabled }: { label: string; confirmLabel?: string; onConfirm: () => void; disabled?: boolean }) {
  const [asking, setAsking] = useState(false);
  if (!asking) {
    return (
      <Button type="button" variant="outline" className="border-danger/50 text-danger hover:bg-danger/10" onClick={() => setAsking(true)} disabled={disabled}>
        {label}
      </Button>
    );
  }
  return (
    <span className="inline-flex flex-wrap gap-2">
      <Button type="button" variant="outline" className="border-danger bg-danger/10 text-danger" onClick={() => { setAsking(false); onConfirm(); }} disabled={disabled}>
        {confirmLabel}
      </Button>
      <Button type="button" variant="ghost" onClick={() => setAsking(false)}>Cancel</Button>
    </span>
  );
}
