"use client"; // Enable client-side features for this component

import React, { useState, useEffect } from "react";
import Image from "next/image";
import FeaturedEvents from "@components/ui/FeaturedEvents";
import AnnouncementCarousel from "@components/ui/AnnouncementCarousel";
import VideoSection from "@components/ui/VideoSection";
import { motion } from "framer-motion";
import { CATEGORY_MAPPING } from "@const/categories";
import { useRouter } from "next/navigation";
import GoogleReviews from "@components/ui/GoogleReviews";
import Link from "next/link";
import { Button } from "@components/ui/button";

/**
 * Home page component that serves as the main landing page for MAV Collectibles
 * Features:
 * - Video section showcasing featured content
 * - Announcement carousel for important updates
 * - Featured events section
 * - Trading card games grid
 * - Why choose us section
 */
export default function Home() {
  // Marketing announcements displayed in the carousel
  const announcements = [
    {
      id: "1",
      title: "New Pokémon TCG Releases",
      description:
        "Check out the latest Paldean Fates expansion, now available in store and online!",
      buttonText: "Shop Now",
      buttonLink: "/category/pokemon-tcg?group=TCG",
      bgColor: "bg-gradient-to-r from-blue-900 to-purple-900",
    },
    {
      id: "2",
      title: "Weekly Tournament - Friday Nights",
      description:
        "Join us every Friday at 6PM for our weekly Pokémon TCG tournament. All skill levels welcome!",
      buttonText: "Learn More",
      buttonLink: "/category/events",
      bgColor: "bg-gradient-to-r from-gray-900 to-gray-800",
    },
    {
      id: "3",
      title: "Free Shipping on Orders Over $50",
      description:
        "For a limited time, get free shipping on all orders over $50. No coupon needed!",
      buttonText: "Start Shopping",
      buttonLink: "/category/tcg",
      bgColor: "bg-gradient-to-r from-[#B38A00]/20 to-[#E6B325]/20",
    },
  ];

  // Trading card game categories with their respective metadata
  const cardGames = [
    {
      title: "Pokemon",
      href: "/products/pokemon",
      image: "/pokemon-logo.png",
      aspectRatio: 2.5,
      squareCategory: "Pokemon TCG",
    },
    {
      title: "Yu-Gi-Oh TCG",
      href: "/products/yugioh",
      image: "/yugioh-logo.png",
      aspectRatio: 2.5,
      squareCategory: "Yu-Gi-Oh",
    },
    {
      title: "DBZ Super TCG",
      href: "/products/dragonball",
      image: "/dragonball.png",
      aspectRatio: 2.5,
      squareCategory: "Dragon Ball Super TCG",
    },
    {
      title: "Digimon",
      href: "/products/digimon",
      image: "/digimon_card_game_logo.png",
      aspectRatio: 2.5,
      squareCategory: "Digimon",
    },
    {
      title: "One Piece",
      href: "/products/onepiece",
      image: "/one-piece-card-game.jpg",
      aspectRatio: 2.5,
      squareCategory: "One Piece Card Game",
    },
    {
      title: "MetaZoo",
      href: "/products/metazoo",
      image: "/Metazoo-logo.png",
      aspectRatio: 2.5,
      squareCategory: "Metazoo",
    },
  ];

  // Animation variants for staggered animations
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  const router = useRouter();

  // Client-side mounting state to prevent hydration issues
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  /**
   * Handles navigation to the product category page when a card game is clicked
   * @param squareCategory - The category identifier from Square
   */
  function handleCardGameClick(squareCategory: string) {
    const mapping = CATEGORY_MAPPING[squareCategory];
    if (!mapping) return;
    const params = new URLSearchParams();
    params.set("group", "TCG");
    params.set("categoryId", mapping.squareCategoryId);
    router.push(`/products?${params.toString()}`);
  }

  return (
    <div className="flex flex-col w-full min-h-screen space-y-8 pt-2">
      {/* Hero video section for featured content */}
      <VideoSection />

      {/* Marketing announcements carousel */}
      <div className="w-full">
        <AnnouncementCarousel announcements={announcements} />
      </div>

      {/* Upcoming events section */}
      <FeaturedEvents />

      {/* Trading card games grid with hover effects and animations */}
      <div className="w-full">
        <motion.h2
          initial={false}
          animate={mounted ? { opacity: 1, y: 0 } : false}
          className="text-3xl font-bold text-center mb-8 text-[#E6B325]"
        >
          Trading Card Games
        </motion.h2>

        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6"
        >
          {cardGames.map((game) => (
            <motion.div
              key={game.href}
              variants={item}
              className="group relative cursor-pointer"
              onClick={() => handleCardGameClick(game.squareCategory)}
            >
              <div className="block">
                <div className="relative overflow-hidden rounded-xl bg-gray-900/50 backdrop-blur-sm border border-gray-800/50 transition-all duration-300 group-hover:border-brand-blue/30 group-hover:bg-gray-900/80">
                  {/* Card Content */}
                  <div className="p-4 flex flex-col items-center space-y-2">
                    {/* Image Container */}
                    <div
                      className="relative w-full"
                      style={{ aspectRatio: game.aspectRatio }}
                    >
                      <Image
                        src={game.image}
                        alt={game.title}
                        fill
                        className="object-contain transition-transform duration-300 group-hover:scale-110"
                        sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      />
                    </div>

                    {/* Title & View All */}
                    <div className="text-center mt-2">
                      <h3 className="text-lg md:text-xl font-bold group-hover:text-[#E6B325] transition-colors">
                        {game.title}
                      </h3>
                      <span className="text-xs md:text-sm text-brand-blue group-hover:text-brand-blue-light transition-colors">
                        VIEW ALL
                      </span>
                    </div>
                  </div>

                  {/* Hover Effect Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Google Reviews Section */}
      <div className="w-full px-4 md:px-8">
        <h2 className="text-2xl font-bold mb-4 text-[#E6B325]">Customer Reviews</h2>
        <GoogleReviews />
      </div>

      {/* Value proposition section highlighting key benefits */}
      <div className="mt-4 text-center w-full">
        <motion.h2
          initial={false}
          animate={mounted ? { opacity: 1, y: 0 } : false}
          className="text-3xl font-bold mb-4 text-[#E6B325]"
        >
          Why Choose MAV Collectibles?
        </motion.h2>
        <motion.div
          initial={false}
          animate={mounted ? { opacity: 1, y: 0 } : false}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2"
        >
          {[
            {
              title: "Quality Selection",
              description:
                "We carefully curate our inventory to offer only the best cards.",
            },
            {
              title: "Expert Knowledge",
              description:
                "Our team is passionate about trading cards and ready to help.",
            },
            {
              title: "Community Focus",
              description:
                "We're more than a store – we're a hub for collectors and players, where everyone gets treated like family.",
            },
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial={false}
              animate={mounted ? { opacity: 1, y: 0 } : false}
              transition={{ delay: index * 0.1 }}
              className="p-6 bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800/50 hover:border-brand-blue/30 transition-all duration-300 hover:bg-gray-900/80"
            >
              <h3 className="text-xl font-semibold mb-2 text-brand-blue-light">
                {feature.title}
              </h3>
              <p className="text-gray-300">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <div className="mt-4 text-center w-full">
        <Link 
          href="/category/tcg" 
          className="inline-block"
        >
          <Button variant="gold">
            CONTINUE BROWSING
          </Button>
        </Link>
      </div>
    </div>
  );
}
