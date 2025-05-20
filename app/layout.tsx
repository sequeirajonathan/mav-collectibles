import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { QueryProvider } from "@providers/QueryProvider";
import { AppProvider } from "@contexts/AppContext";
import "@styles/globals.css";
import { SupabaseProvider } from "@contexts/SupabaseContext";
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
        <SupabaseProvider>
          <QueryProvider>
            <AppProvider>
              <CartProvider>
                <NuqsAdapter>
                  {children}
                </NuqsAdapter>
              </CartProvider>
            </AppProvider>
          </QueryProvider>
        </SupabaseProvider>
      </body>
    </html>
  );
}
