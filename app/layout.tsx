import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import AlertBanner from "@/components/ui/AlertBanner";
import { QueryProvider } from "@/providers/QueryProvider";
import { AppProvider } from "@/contexts/AppContext";
import "./globals.css";
import "./videojs-theme.css";
import ScrollToTop from '@/components/ui/ScrollToTop';
import { Toaster } from 'react-hot-toast';
import { Suspense } from 'react';
import '@/styles/video-player.css';

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
  description: "Your local source for Pokémon, Yu-Gi-Oh!, Dragon Ball, One Piece and more trading cards",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-black text-white font-sans flex flex-col`}
      >
        {/* Make sure any providers here are compatible with SSR */}
        <QueryProvider>
          <AppProvider>
            <AlertBanner />
            <Navbar />
            <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-grow">
              <Suspense fallback={<div>Loading...</div>}>
                {children}
              </Suspense>
            </main>
            <Footer />
            <ScrollToTop />
            <Toaster position="top-right" />
          </AppProvider>
        </QueryProvider>
      </body>
    </html>
  );
}