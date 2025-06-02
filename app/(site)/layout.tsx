import type { Metadata } from "next";
import Navbar from "@components/ui/Navbar";
import Footer from "@components/ui/Footer";
import AlertBanner from "@components/ui/AlertBanner";
import "@styles/globals.css";
import "@styles/video-player.css";
import ScrollToTop from "@components/ui/ScrollToTop";
import { Toaster } from "react-hot-toast";
import { Suspense } from "react";
import CookieConsent from "@components/ui/CookieConsent";
import { fetchAlertBanner } from "@services/alertBannerService";

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

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Preload the alert banner data
  const alertBannerData = await preloadAlertBanner();

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#E6B325]"></div>
      </div>
    }>
      <AlertBanner />
      <Navbar />
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-grow">
        {children}
      </main>
      <Footer />
      <ScrollToTop />
      <Toaster position="top-right" />
      <CookieConsent />
    </Suspense>
  );
}