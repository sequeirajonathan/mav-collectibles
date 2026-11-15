import type { Metadata } from "next";
import { Suspense } from "react";
import { Toaster } from "react-hot-toast";
import { SiteHeader } from "@components/layout/site-header";
import { AdminNav } from "@components/admin/admin-nav";
import { ShopModeProvider } from "@components/layout/shop-mode";
import { getFlags } from "@lib/data/site";
import { getCurrentUser } from "@lib/auth/server";
import { HIRING_ROLES, UserRole } from "@interfaces/roles";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin · MAV" }, robots: { index: false } };

async function Nav() {
  const user = await getCurrentUser();
  return <AdminNav isAdmin={user?.role === UserRole.ADMIN} canHire={!!user && HIRING_ROLES.includes(user.role)} />;
}

/** The header's Vendors link follows the same switch as the public site. */
async function Header() {
  const flags = await getFlags();
  return (
    <ShopModeProvider live={flags.shopLive} shopVisible={false} vendorsVisible={flags.vendorsVisible}>
      <SiteHeader />
    </ShopModeProvider>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={<SiteHeader />}>
        <Header />
      </Suspense>
      <div className="mx-auto w-full max-w-6xl flex-1 px-safe py-6">
        <div className="mb-6 border-b border-line pb-3">
          <Suspense fallback={<div className="h-10" />}>
            <Nav />
          </Suspense>
        </div>
        {children}
      </div>
      <Toaster position="bottom-center" toastOptions={{ style: { background: "var(--panel-2)", color: "var(--foreground)", border: "1px solid var(--line)" } }} />
    </>
  );
}
