import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Navbar from "@components/ui/Navbar";
import Footer from "@components/ui/Footer";
import AlertBanner from "@components/ui/AlertBanner";
import { QueryProvider } from "@providers/QueryProvider";
import { AppProvider } from "@contexts/AppContext";
import "@styles/globals.css";
import "./videojs-theme.css";
import ScrollToTop from "@components/ui/ScrollToTop";
import { Toaster } from "react-hot-toast";
import { Suspense } from "react";
import "@styles/video-player.css";
import { SupabaseProvider } from "@contexts/SupabaseContext";
import CookieConsent from "@components/ui/CookieConsent";
import { fetchAlertBanner } from "@services/alertBannerService";
import { CartProvider } from "@contexts/CartContext";
import { NuqsAdapter } from "nuqs/adapters/next/app";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MAV Collectables - Trading Card Game Shop",
  description:
    "Your local source for Pokémon, Yu-Gi-Oh!, Dragon Ball, One Piece and more trading cards",
};

// Preload alert banner data
async function preloadAlertBanner() {
  try {
    const alertBanner = await fetchAlertBanner();
    return alertBanner;
  } catch {
    // Silently fail and return null - we'll fetch on the client side
    return null;
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Preload the alert banner data
  const alertBannerData = await preloadAlertBanner();

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-black text-white font-sans flex flex-col`}
      >
        <SupabaseProvider>
          <QueryProvider initialAlertBanner={alertBannerData}>
            <AppProvider>
              <CartProvider>
                <NuqsAdapter>
                  <AlertBanner />
                  <Suspense fallback={<div>Loading...</div>}>
                    <Navbar />
                    <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-grow">
                      {children}
                    </main>
                    <Footer />
                    <ScrollToTop />
                    <Toaster position="top-right" />
                    <CookieConsent />
                  </Suspense>
                </NuqsAdapter>
              </CartProvider>
            </AppProvider>
          </QueryProvider>
        </SupabaseProvider>
      </body>
    </html>
  );
}
