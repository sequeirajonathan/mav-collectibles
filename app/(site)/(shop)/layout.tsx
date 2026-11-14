import { NuqsAdapter } from "nuqs/adapters/next/app";
import { QueryProvider } from "@components/shop/query-provider";
import { ShowcaseNotice } from "@components/shop/showcase-notice";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <NuqsAdapter>
        <ShowcaseNotice />
        {children}
      </NuqsAdapter>
    </QueryProvider>
  );
}
