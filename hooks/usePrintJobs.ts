"use client";

import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "@lib/api/client";
import { printJobListSchema, type PrintJob } from "@lib/contracts/print-jobs";
import { getBrowserClient } from "@utils/supabase/client";

/** Print queue for the print-agent screen, refreshed live via Supabase Realtime (RLS-scoped). */
export function usePrintJobs() {
  const [printJobs, setPrintJobs] = useState<PrintJob[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setPrintJobs(await apiRequest(printJobListSchema, "/print-jobs"));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Failed to load print jobs"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial load + live updates from an external system (Supabase Realtime).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
    let cleanup: (() => void) | undefined;
    let cancelled = false;
    void getBrowserClient().then((supabase) => {
      if (cancelled) return;
      const channel = supabase
        .channel("print-jobs-ui")
        .on("postgres_changes", { event: "*", schema: "public", table: "print_jobs" }, () => void refresh())
        .subscribe();
      cleanup = () => void supabase.removeChannel(channel);
    });
    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [refresh]);

  return { printJobs, error, isLoading, refresh };
}
