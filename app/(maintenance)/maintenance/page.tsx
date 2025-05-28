"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "@contexts/AppContext";
import { useAuth } from "@contexts/AuthContext";
import { Button } from "@components/ui/button";
import Image from "next/image";
import { LoginModal } from "@components/ui/LoginModal";
import CautionTape from "@components/ui/CautionTape";

export default function MaintenancePage() {  
  const router = useRouter();
  const { featureFlags } = useAppContext();
  const { isAdmin } = useAuth();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  useEffect(() => {
    // If maintenance mode is disabled or user is admin, redirect to home
    if (!featureFlags?.find(f => f.name === "maintenanceMode")?.enabled || isAdmin) {
      router.push("/");
    }
  }, [featureFlags, isAdmin, router]);

  return (
    <div className="flex flex-col min-h-screen w-full bg-black overflow-hidden">
      <CautionTape text="UNDER CONSTRUCTION" position="top" offset={48} height="4rem" />
      <CautionTape text="UNDER CONSTRUCTION" position="bottom" offset={48} height="4rem" />
      <div
        className="flex flex-col justify-center items-center w-full relative z-30 px-2"
        style={{
          height: 'calc(100vh - 224px)', // 112px top + 112px bottom
          marginTop: '112px',
          marginBottom: '112px',
          overflowY: 'auto',
        }}
      >
        {/* Pikachu and heading */}
        <div className="flex flex-col items-center w-full max-w-xl">
          <div className="relative w-40 h-40 md:w-64 md:h-64 mx-auto mb-4 md:mb-8">
            <Image
              src="/images/pikachu_construction.gif"
              alt="Pikachu Construction"
              fill
              unoptimized
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-[#E6B325] mb-4 md:mb-6">
            Coming Soon
          </h1>
          <p className="text-gray-300 text-base md:text-lg mb-4 md:mb-8 max-w-xs md:max-w-lg mx-auto">
            We&apos;re building something special for all card game enthusiasts! 
            Our team is hard at work creating the ultimate trading card game experience. 
            Stay tuned for the grand opening of MAV Collectibles!
          </p>
        </div>
        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center w-full mb-4">
          <Button
            variant="gold"
            onClick={() => setIsLoginModalOpen(true)}
            className="px-8 py-4 text-base md:text-lg"
          >
            Admin Login
          </Button>
          <Button
            variant="outlineGold"
            onClick={() => router.refresh()}
            className="px-8 py-4 text-base md:text-lg"
          >
            Check Progress
          </Button>
        </div>
      </div>
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
      />
    </div>
  );
} 