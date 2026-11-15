import type { NextConfig } from "next";
import type { RemotePattern } from "next/dist/shared/lib/image-config";

// Storage images are served from whichever Supabase project this environment uses.
function supabaseImagePattern(): RemotePattern[] {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return [];
  const { protocol, hostname, port } = new URL(url);
  return [
    {
      protocol: protocol.replace(":", "") as "http" | "https",
      hostname,
      port,
      pathname: "/storage/v1/object/public/**",
    },
  ];
}

// Local development and CI serve storage from 127.0.0.1, which the image
// optimizer refuses by default. Never true for a real (public) Supabase URL.
const localStorage = /^https?:\/\/(127\.0\.0\.1|localhost)(:|\/|$)/.test(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");

const nextConfig: NextConfig = {
  // Partial prerendering + `use cache`: static shells stream instantly, dynamic
  // parts render inside <Suspense> boundaries.
  cacheComponents: true,
  typedRoutes: true,
  images: {
    dangerouslyAllowLocalIP: localStorage,
    formats: ["image/avif", "image/webp"],
    qualities: [75, 80, 90],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    remotePatterns: [
      ...supabaseImagePattern(),
      {
        protocol: "https",
        hostname: "items-images-production.s3.us-west-2.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "square-catalog-sandbox.s3.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "square-catalog-production.s3.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "ubkfii3geuyo44gn.public.blob.vercel-storage.com",
      },
      {
        protocol: "https",
        hostname: "images.pokemontcg.io",
      },
      {
        protocol: "https",
        hostname: "tcgplayer-cdn.tcgplayer.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "i.ytimg.com",
      },
    ],
  },
};

export default nextConfig;
