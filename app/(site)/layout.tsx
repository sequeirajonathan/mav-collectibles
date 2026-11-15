import { Suspense } from "react";
import { Toaster } from "react-hot-toast";
import { SiteHeader } from "@components/layout/site-header";
import { SiteFooter } from "@components/layout/site-footer";
import { AlertBanner } from "@components/layout/alert-banner";
import { ShopModeProvider } from "@components/layout/shop-mode";
import { getFlags } from "@lib/data/site";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const flags = await getFlags();
  return (
    <ShopModeProvider live={flags.shopLive} shopVisible={flags.shopVisible} vendorsVisible={flags.vendorsVisible}>
      <Suspense fallback={null}>
        <AlertBanner />
      </Suspense>
      <SiteHeader />
      <main id="main" className="mx-auto w-full max-w-7xl flex-1 px-safe py-6 fold:py-8">
        {children}
      </main>
      <SiteFooter />
      <Toaster position="bottom-center" toastOptions={{ style: { background: "var(--panel-2)", color: "var(--foreground)", border: "1px solid var(--line)" } }} />
    </ShopModeProvider>
  );
}
