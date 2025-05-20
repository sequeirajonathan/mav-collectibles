import "@styles/globals.css";
import { Toaster } from "react-hot-toast";
import { QueryProvider } from "@providers/QueryProvider";
import { AppProvider } from "@contexts/AppContext";
import { SupabaseProvider } from "@contexts/SupabaseContext";

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
    <html lang="en">
      <body className="antialiased min-h-screen h-screen bg-black text-white font-sans flex flex-col items-center justify-center overflow-hidden">
        <SupabaseProvider>
          <QueryProvider>
            <AppProvider>
              <main className="flex flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 items-center justify-center">
                {children}
              </main>
              <Toaster position="top-right" />
            </AppProvider>
          </QueryProvider>
        </SupabaseProvider>
      </body>
    </html>
  );
} 