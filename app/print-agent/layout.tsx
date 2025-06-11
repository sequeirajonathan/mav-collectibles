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
    <div className="min-h-screen bg-black flex flex-col">
      <div className="flex-1 flex flex-col">
        {children}
      </div>
      <Toaster position="top-right" />
    </div>
  );
} 