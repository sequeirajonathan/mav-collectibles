"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@components/ui/button";
import Image from "next/image";
import { LoginModal } from "@components/ui/LoginModal";
import CautionTape from "@components/ui/CautionTape";
import { useAuth } from "@clerk/nextjs";

export default function MaintenancePage() {
  const router = useRouter();
  const { userId } = useAuth();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const isElectronRef = useRef(false);

  /** -----------------------------------------------------------
   *  DESKTOP-ONLY GAP BELOW THE BOTTOM STRIPE
   *  -----------------------------------------------------------
   *  • topOffset is always 0 → upper tape sits flush with the viewport
   *  • bottomOffset is 48 px on ≥ 1024 px, else 0 px
   */
  const [bottomOffset, setBottomOffset] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      setBottomOffset(window.innerWidth >= 1024 ? 48 : 0);
    };
    handleResize(); // run once
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Check if request is from Electron app
  useEffect(() => {
    isElectronRef.current = typeof window !== 'undefined' && window.navigator.userAgent.includes('Electron');
  }, []);

  // bypass the page if maintenance mode is off, admin is logged in, or it's an Electron app
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_MAINTENANCE_MODE !== "true" || userId || isElectronRef.current) {
      if (isElectronRef.current) {
        router.push("/print-agent/login");
      } else {
        router.push("/");
      }
    }
  }, [userId, router]);

  /* -----------------------------------------------------------
   *  STRIPE & CONTENT DIMENSIONS
   *  -----------------------------------------------------------
   *  – every stripe is 4 rem (64 px) tall
   *  – we reserve:
   *      • 64 px   for the top stripe
   *      • 64 px + bottomOffset for the bottom stripe
   *  – the wrapper then fills the remaining space and centres its
   *    children with flexbox
   */
  const tapeHeight = 64; // px

  const reservedVerticalSpace = tapeHeight * 2 + bottomOffset;

  // If it's an Electron app, don't render the maintenance page
  if (isElectronRef.current) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen w-full bg-black overflow-hidden">
      {/* ---------- TOP STRIPE (flush) ---------- */}
      <CautionTape
        text="UNDER CONSTRUCTION"
        position="top"
        offset={0} // sits flush
        height="4rem"
      />

      {/* ---------- BOTTOM STRIPE (48 px gap on desktop) ---------- */}
      <CautionTape
        text="UNDER CONSTRUCTION"
        position="bottom"
        offset={bottomOffset}
        height="4rem"
      />

      {/* ---------- MAIN CONTENT ---------- */}
      <div
        className="flex flex-col justify-center items-center w-full relative z-30 px-4"
        style={{
          // fill the viewport minus both stripes + desktop gap
          height: `calc(100vh - ${reservedVerticalSpace}px)`,
          marginTop: `${tapeHeight}px`,
          marginBottom: `${tapeHeight + bottomOffset}px`,
          overflowY: "auto",
        }}
      >
        {/* Pikachu + Heading */}
        <div className="flex flex-col items-center w-full max-w-md text-center">
          <div className="relative w-40 h-40 md:w-56 md:h-56 lg:w-80 lg:h-80 mb-4 md:mb-6">
            <Image
              src="/images/pikachu_construction.gif"
              alt="Pikachu Construction"
              fill
              unoptimized
              className="object-contain"
              priority
            />
          </div>

          <h1 className="text-3xl md:text-5xl font-bold text-[#E6B325] mb-3 md:mb-5">
            Coming Soon
          </h1>

          <p className="text-gray-300 text-sm md:text-lg mb-6 max-w-xs md:max-w-lg">
            We&apos;re building something special for all card game enthusiasts!
            Our team is hard at work creating the ultimate trading-card
            experience. Stay tuned for the grand opening of MAV Collectibles!
          </p>
        </div>

        {/* Admin button */}
        <div className="flex justify-center w-full max-w-sm mb-4">
          <Button
            variant="gold"
            onClick={() => setIsLoginModalOpen(true)}
            className="w-full sm:w-auto px-6 py-3 text-base md:text-lg"
          >
            Admin&nbsp;Login
          </Button>
        </div>
      </div>

      {/* Login modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </div>
  );
}
