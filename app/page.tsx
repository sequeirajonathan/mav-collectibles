"use client"; // Add this since we're using client-side features

import React from "react";
import Image from "next/image";
import Link from "next/link";
import FeaturedEvents from "@components/ui/FeaturedEvents";
import AnnouncementCarousel from "@components/ui/AnnouncementCarousel";
import VideoSection from "@components/ui/VideoSection";
import { ProductList } from "@components/ui/ProductList";
import { motion } from "framer-motion";

export default function Home() {
  // Sample announcements data
  const announcements = [
    {
      id: "1",
      title: "New Pokémon TCG Releases",
      description:
        "Check out the latest Paldean Fates expansion, now available in store and online!",
      buttonText: "Shop Now",
      buttonLink: "/products/pokemon/paldean-fates",
      bgColor: "bg-gradient-to-r from-blue-900 to-purple-900",
    },
    {
      id: "2",
      title: "Weekly Tournament - Friday Nights",
      description:
        "Join us every Friday at 6PM for our weekly Pokémon TCG tournament. All skill levels welcome!",
      buttonText: "Learn More",
      buttonLink: "/events/tournaments",
      bgColor: "bg-gradient-to-r from-gray-900 to-gray-800",
    },
    {
      id: "3",
      title: "Free Shipping on Orders Over $50",
      description:
        "For a limited time, get free shipping on all orders over $50. No coupon needed!",
      buttonText: "Start Shopping",
      buttonLink: "/products",
      bgColor: "bg-gradient-to-r from-[#B38A00]/20 to-[#E6B325]/20",
    },
  ];

  const cardGames = [
    {
      title: "Pokemon",
      href: "/products/pokemon",
      image: "/pokemon-logo.png",
      aspectRatio: 2.5,
    },
    {
      title: "Yu-Gi-Oh TCG",
      href: "/products/yugioh",
      image: "/yugioh-logo.png",
      aspectRatio: 2.5,
    },
    {
      title: "DBZ Super TCG",
      href: "/products/dragonball",
      image: "/dragonball.png",
      aspectRatio: 2,
    },
    {
      title: "Digimon",
      href: "/products/digimon",
      image: "/digimon_card_game_logo.png",
      aspectRatio: 2.5,
    },
    {
      title: "One Piece",
      href: "/products/onepiece",
      image: "/one-piece-card-game.jpg",
      aspectRatio: 2,
    },
    {
      title: "MetaZoo",
      href: "/products/metazoo",
      image: "/Metazoo-logo.png",
      aspectRatio: 2,
    },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-8 pt-2">
      {/* Video Section - moved above the announcement carousel */}
      <VideoSection />

      {/* Announcement Carousel */}
      <div className="w-full max-w-6xl">
        <AnnouncementCarousel announcements={announcements} />
      </div>

      {/* Featured Events Section */}
      <FeaturedEvents />

      {/* Card Games Grid */}
      <div className="w-full max-w-6xl">
        <motion.h2 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold text-center mb-8 text-brand-gold"
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
              className="group relative"
            >
              <Link href={game.href} className="block">
                <div className="relative overflow-hidden rounded-xl bg-gray-900/50 backdrop-blur-sm border border-gray-800/50 transition-all duration-300 group-hover:border-brand-blue/30 group-hover:bg-gray-900/80">
                  {/* Card Content */}
                  <div className="p-4 flex flex-col items-center space-y-2">
                    {/* Image Container */}
                    <div className="relative w-full" style={{ aspectRatio: game.aspectRatio }}>
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
                      <h3 className="text-lg md:text-xl font-bold group-hover:text-brand-gold transition-colors">
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
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Why Choose Section */}
      <div className="mt-4 text-center w-full max-w-6xl">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl font-bold mb-4 text-brand-gold"
        >
          Why Choose MAV Collectibles?
        </motion.h2>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
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
                "We're more than a store - we're a hub for collectors and players.",
            },
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
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

      {/* Featured Products */}
      <ProductList products={[]} />
    </div>
  );
}
