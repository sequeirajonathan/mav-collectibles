"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "@contexts/AppContext";
import { useSupabase } from "@contexts/SupabaseContext";
import { Button } from "@components/ui/button";
import Image from "next/image";
import { motion } from "framer-motion";
import { LoginModal } from "@components/ui/LoginModal";
import CautionTape from "@components/ui/CautionTape";

export default function MaintenancePage() {
  const router = useRouter();
  const { featureFlags } = useAppContext();
  const { userProfile } = useSupabase();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  useEffect(() => {
    // If maintenance mode is disabled or user is admin, redirect to home
    if (!featureFlags?.find(f => f.name === "maintenanceMode")?.enabled || userProfile?.role === "ADMIN") {
      router.push("/");
    }
  }, [featureFlags, userProfile, router]);

  return (
    <div className="relative min-h-screen w-full bg-black overflow-hidden">
      <CautionTape text="UNDER CONSTRUCTION" position="top" offset={0} height="4rem" />
      <CautionTape text="UNDER CONSTRUCTION" position="bottom" offset={48} height="4rem" />
      <div
        className="flex flex-col items-center justify-center w-full relative z-30 min-h-[calc(100vh-8rem)] mt-[4rem] mb-[4rem] md:min-h-[calc(100vh-12rem)] md:mt-[6rem] md:mb-[6rem]"
      >
        <div className="text-center p-8 max-w-2xl mx-4 flex flex-col items-center justify-center">
          <motion.div 
            initial={{ scale: 0.8, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ 
              type: "spring",
              stiffness: 260,
              damping: 20,
              delay: 0.2
            }}
            className="relative w-64 h-64 mx-auto mb-8"
          >
            <Image
              src="/images/pikachu_construction.gif"
              alt="Pikachu Construction"
              fill
              unoptimized
              className="object-contain"
              priority
            />
          </motion.div>
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-5xl font-bold text-[#E6B325] mb-6"
          >
            Coming Soon
          </motion.h1>
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="space-y-4"
          >
            <p className="text-gray-300 text-lg mb-8 max-w-lg mx-auto">
              We&apos;re building something special for all card game enthusiasts! 
              Our team is hard at work creating the ultimate trading card game experience. 
              Stay tuned for the grand opening of MAV Collectibles!
            </p>
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Button
                variant="gold"
                onClick={() => setIsLoginModalOpen(true)}
                className="px-8 py-6 text-lg"
              >
                Admin Login
              </Button>
              <Button
                variant="outlineGold"
                onClick={() => window.location.reload()}
                className="px-8 py-6 text-lg"
              >
                Check Progress
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </div>

      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
      />
    </div>
  );
} 