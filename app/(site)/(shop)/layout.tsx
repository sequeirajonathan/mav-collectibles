import { Suspense } from "react";
import { ShopGate } from "@components/shop/shop-gate";
import { Skeleton } from "@components/ui/skeleton";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { QueryProvider } from "@components/shop/query-provider";
import { ShowcaseNotice } from "@components/shop/showcase-notice";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <NuqsAdapter>
        <Suspense fallback={<Skeleton className="h-96 rounded-2xl" />}>
          <ShopGate>
            <ShowcaseNotice />
            {children}
          </ShopGate>
        </Suspense>
      </NuqsAdapter>
    </QueryProvider>
  );
}
