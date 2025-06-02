import "@styles/globals.css";
import { Toaster } from "react-hot-toast";

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
    <main className="flex flex-1 w-full min-h-screen bg-black text-white">
      <div className="flex flex-1 items-center justify-center w-full h-full">
        {children}
      </div>
    </main>
  );
} 