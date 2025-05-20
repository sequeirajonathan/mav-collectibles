import Navbar from '@components/ui/Navbar';
import { QueryProvider } from '@providers/QueryProvider';
import { AppProvider } from '@contexts/AppContext';
import { CartProvider } from '@contexts/CartContext';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
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
    <QueryProvider>
      <AppProvider>
        <CartProvider>
          <NuqsAdapter>
            <Suspense fallback={<div className="w-full min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>}>
              <Navbar />
              <main className="w-full min-h-screen bg-black text-white">
                {children}
                <DebugInfo />
                <AdminSettingsUpdater />
              </main>
            </Suspense>
          </NuqsAdapter>
        </CartProvider>
      </AppProvider>
    </QueryProvider>
  );
} 