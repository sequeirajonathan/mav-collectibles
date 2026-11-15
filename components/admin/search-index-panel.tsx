"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { RefreshCw } from "lucide-react";
import { Button } from "@components/ui/button";
import { cardVariants } from "@components/ui/card";
import { refreshSearchIndexAction } from "@lib/actions/site";
import type { IndexStatus } from "@lib/catalog/search-index";
import { cn } from "@utils";

const when = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Chicago" });

/** Shows how fresh the shop's search index is and lets an admin rebuild it. */
export function SearchIndexPanel({ status }: { status: IndexStatus }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const refresh = () =>
    startTransition(async () => {
      const result = await refreshSearchIndexAction({});
      if (!result.ok) return void toast.error(result.error);
      toast.success(`Search updated: ${result.data.itemCount.toLocaleString()} products`);
      router.refresh();
    });
  const busy = pending || status.running;
  return (
    <div className={cn(cardVariants({ padding: "md" }), "flex flex-col gap-3 fold:flex-row fold:items-center fold:justify-between")}>
      <div>
        <p className="font-semibold">
          {status.itemCount > 0 ? `${status.itemCount.toLocaleString()} products searchable` : "Search list not built yet"}
        </p>
        <p className="text-sm text-muted-foreground">
          {status.itemCount > 0 && status.finishedAt
            ? `Last updated ${when.format(new Date(status.finishedAt))}. It updates itself every night; stock is always checked live.`
            : "Until it's built, search asks Square directly, which misses typos and some names. Building takes about a minute."}
        </p>
        {status.error && <p className="mt-1 text-sm text-danger">The last update failed: {status.error}</p>}
      </div>
      <Button variant="outline" onClick={refresh} disabled={busy} className="shrink-0">
        <RefreshCw aria-hidden className={cn(busy && "animate-spin")} />
        {busy ? "Updating…" : "Update now"}
      </Button>
    </div>
  );
}
