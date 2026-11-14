import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@styles/globals.css";
import { AuthProvider } from "@contexts/AuthContext";
import { CartProvider } from "@contexts/CartContext";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"], display: "swap" });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: { default: "MAV Collectibles · Pokémon & TCG events in Montgomery, TX", template: "%s · MAV Collectibles" },
  description: "Pokémon league nights, TCG tournaments, prereleases, vendor days and trade nights at MAV Collectibles.",
  applicationName: "MAV Collectibles",
  appleWebApp: { capable: true, title: "MAV", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Lets content extend under notches/fold bars; layouts pad with env(safe-area-inset-*).
  viewportFit: "cover",
  themeColor: "#000000",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="flex min-h-dvh flex-col bg-background font-sans text-foreground">
        <AuthProvider>
          <CartProvider>{children}</CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
