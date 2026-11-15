import type { Metadata } from "next";
import { Suspense } from "react";
import { Toaster } from "react-hot-toast";
import { SiteHeader } from "@components/layout/site-header";
import { AdminNav } from "@components/admin/admin-nav";
import { getCurrentUser } from "@lib/auth/server";
import { UserRole } from "@interfaces/roles";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin · MAV" }, robots: { index: false } };

async function Nav() {
  const user = await getCurrentUser();
  return <AdminNav isAdmin={user?.role === UserRole.ADMIN} />;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
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
