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
    <Suspense fallback={<div className="w-full min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>}>
      <Navbar />
      <main className="w-full min-h-screen bg-black text-white">
        {children}
        <DebugInfo />
        <AdminSettingsUpdater />
      </main>
    </Suspense>
  );
} 