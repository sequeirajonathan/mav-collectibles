import type { Metadata } from "next";
import "@styles/globals.css";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "MAV Print Agent",
  description: "Print agent for MAV Collectibles",
};

export default function PrintAgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-black text-white">
      <main className="w-full h-screen flex items-center justify-center">
        {children}
      </main>
      <Toaster position="top-right" />
    </div>
  );
} 