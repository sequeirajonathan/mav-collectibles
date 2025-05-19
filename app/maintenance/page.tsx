"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "@contexts/AppContext";
import { useSupabase } from "@contexts/SupabaseContext";
import { Button } from "@components/ui/button";
import { Loader2 } from "lucide-react";

export default function MaintenancePage() {
  const router = useRouter();
  const { featureFlags } = useAppContext();
  const { userProfile } = useSupabase();

  useEffect(() => {
    // If maintenance mode is disabled or user is admin, redirect to home
    if (!featureFlags?.find(f => f.name === "maintenanceMode")?.enabled || userProfile?.role === "ADMIN") {
      router.push("/");
    }
  }, [featureFlags, userProfile, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="text-center p-8 max-w-md">
        <h1 className="text-4xl font-bold text-brand-gold mb-4">Under Maintenance</h1>
        <div className="w-16 h-16 mx-auto mb-6">
          <Loader2 className="w-full h-full animate-spin text-brand-gold" />
        </div>
        <p className="text-gray-300 mb-8">
          We&apos;re currently performing some maintenance on our site. Please check back later.
        </p>
        <Button
          variant="gold"
          onClick={() => router.push("/login")}
        >
          Admin Login
        </Button>
      </div>
    </div>
  );
} 