// app/(site)/maintenance.tsx
"use client";

import { useEffect, useState } from "react";
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

  // Track an offset value: 48px for ≥1024px (lg and up), 0 for <1024px (md and below)
  const [tapeOffset, setTapeOffset] = useState(0);

  useEffect(() => {
    // Function to update offset based on window.innerWidth
    const updateOffset = () => {
      if (window.innerWidth >= 1024) {
        setTapeOffset(48);
      } else {
        setTapeOffset(0);
      }
    };

    // Run once on mount:
    updateOffset();
    // Then update on resize:
    window.addEventListener("resize", updateOffset);

    return () => {
      window.removeEventListener("resize", updateOffset);
    };
  }, []);

  // If maintenance mode is off or user is logged in, redirect away
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_MAINTENANCE_MODE !== "true" || userId) {
      router.push("/");
    }
  }, [userId, router]);

  // Each tape is 4rem (64px) tall. We'll still use 4rem for height.
  const tapeHeightPx = 64;

  return (
    <div className="flex flex-col min-h-screen w-full bg-black overflow-hidden">
      {/** TOP TAPE: offset={tapeOffset} → 48px only on lg+ */}
      <CautionTape
        text="UNDER CONSTRUCTION"
        position="top"
        offset={tapeOffset}
        height="4rem"
      />

      {/** BOTTOM TAPE: same logic */}
      <CautionTape
        text="UNDER CONSTRUCTION"
        position="bottom"
        offset={tapeOffset}
        height="4rem"
      />

      {/**
        Content wrapper:
        - marginTop / marginBottom = 64px + whatever tapeOffset is on that side.
        - But since offset only pushes the tape itself farther in from the edge on desktop,
          we still need to reserve exactly 64px + tapeOffset so content never overlaps.
        - On md and below, tapeOffset === 0 → content's top is 64px from viewport top.
        - On lg+, tapeOffset === 48px → content's top is 112px from viewport top.
      */}
      <div
        className="flex flex-col justify-center items-center w-full relative z-30 px-4"
        style={{
          height: `calc(100vh - ${tapeHeightPx * 2 + tapeOffset * 2}px)`,
          marginTop: `${tapeHeightPx + tapeOffset}px`,
          marginBottom: `${tapeHeightPx + tapeOffset}px`,
          overflowY: "auto",
        }}
      >
        {/** Pikachu + Heading */}
        <div className="flex flex-col items-center w-full max-w-md text-center">
          {/** Pikachu image: 
              - w-32 h-32 on base
              - md:w-56 h-56 on ≥768px
              - lg:w-80 h-80 on ≥1024px
          */}
          <div className="relative w-32 h-32 md:w-56 md:h-56 lg:w-80 lg:h-80 mb-4 md:mb-6">
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
            We&apos;re building something special for all card game enthusiasts! Our
            team is hard at work creating the ultimate trading card game experience.
            Stay tuned for the grand opening of MAV Collectibles!
          </p>
        </div>

        {/** Buttons: centered single button */}
        <div className="flex justify-center w-full max-w-sm mb-4">
          <Button
            variant="gold"
            onClick={() => setIsLoginModalOpen(true)}
            className="w-full sm:w-auto px-6 py-3 text-base md:text-lg"
          >
            Admin Login
          </Button>
        </div>
      </div>

      {/** Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </div>
  );
}
