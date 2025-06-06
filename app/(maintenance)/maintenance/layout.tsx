import "@styles/globals.css";
import { Suspense } from 'react';

export const metadata = {
  title: "MAV Collectables - Maintenance",
  description: "Site is currently under maintenance",
};

export default function MaintenanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#E6B325]"></div></div>}>
      <main className="flex flex-1 w-full min-h-screen bg-black text-white">
        <div className="flex flex-1 items-center justify-center w-full h-full">
          {children}
        </div>
      </main>
    </Suspense>
  );
} 