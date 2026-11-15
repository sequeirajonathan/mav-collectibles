import type { Metadata, Viewport } from "next";
import { siteUrl } from "@lib/seo";
import { SITE_STYLE } from "@const/site-style";
import { Bangers, Geist, Geist_Mono } from "next/font/google";
import "@styles/globals.css";
import { AuthProvider } from "@contexts/AuthContext";
import { CartProvider } from "@contexts/CartContext";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"], display: "swap" });
/* Comic lettering for headlines and big numerals. */
const bangers = Bangers({ variable: "--font-bangers", subsets: ["latin"], weight: "400", display: "swap" });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: { default: "MAV Collectibles · Pokémon & TCG events in Montgomery, TX", template: "%s · MAV Collectibles" },
  description:
    "Pokémon cards and trading card games in Montgomery, TX. Sealed product, singles and graded cards, plus league nights, tournaments and pre-releases. We buy, sell and trade.",
  applicationName: "MAV Collectibles",
  metadataBase: new URL(siteUrl()),
  // Each page's canonical address is its own path on the main domain.
  alternates: { canonical: "./" },
  openGraph: {
    type: "website",
    siteName: "MAV Collectibles",
    locale: "en_US",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "MAV Collectibles: Pokémon and trading card games in Montgomery, TX" }],
  },
  twitter: { card: "summary_large_image", images: ["/og.png"] },
  // iOS "Add to Home Screen": app title, status bar, and the home-screen icon.
  appleWebApp: { capable: true, title: "MAV", statusBarStyle: "default" },
  icons: { icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }], apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }] },
  formatDetection: { telephone: false },
};
import { THEME_STORAGE_KEY } from "@components/layout/theme";
import { ServiceWorker } from "@components/layout/install-app";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Lets content extend under notches/fold bars; layouts pad with env(safe-area-inset-*).
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2f6fb" },
    { media: "(prefers-color-scheme: dark)", color: "#f2f6fb" },
  ],
  colorScheme: "light dark",
};

/**
 * Light is the default. A visitor's choice is remembered in localStorage and
 * applied here, before anything paints, so there is no flash of the wrong theme.
 */
const THEME_SCRIPT = `try{if(localStorage.getItem("${THEME_STORAGE_KEY}")==="dark")document.documentElement.dataset.theme="dark"}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // The theme script below sets data-theme before first paint, so the
    // attribute can differ from the server's HTML.
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${bangers.variable}`} data-style={SITE_STYLE} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="flex min-h-dvh flex-col bg-background font-sans text-foreground">
        <AuthProvider>
          <CartProvider>{children}</CartProvider>
          <ServiceWorker />
        </AuthProvider>
      </body>
    </html>
  );
}
