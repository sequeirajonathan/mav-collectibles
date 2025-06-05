import Navbar from '@components/ui/Navbar';
import DebugInfo from '@components/admin/DebugInfo';
import AdminSettingsUpdater from '@components/admin/AdminSettingsUpdater';
import { Suspense } from 'react';
import '@styles/globals.css';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#E6B325]"></div></div>}>
      <Navbar />
      <main className="w-full min-h-screen bg-black text-white pb-12">
        {children}
        <DebugInfo />
        <AdminSettingsUpdater />
      </main>
    </Suspense>
  );
} 