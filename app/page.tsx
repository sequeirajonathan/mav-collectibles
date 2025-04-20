"use client"; // Add this since we're using client-side features

import React from "react";
import Image from "next/image";
import Link from "next/link";
import FeaturedEvents from "@/components/ui/FeaturedEvents";
import AnnouncementCarousel from "@/components/ui/AnnouncementCarousel";
import VideoSection from '@/components/ui/VideoSection';
import ProductList from "@/components/ui/ProductList";

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

  return (
    <div className="flex flex-col items-center justify-center space-y-12">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4 text-brand-gold">
          Welcome to MAV Collectibles
        </h1>
        <p className="text-xl">
          Your premier destination for trading card games
        </p>
      </div>
      {/* Announcement Carousel */}
      <div className="w-full max-w-6xl">
        <AnnouncementCarousel announcements={announcements} />
      </div>
      {/* Video Section - will show either live stream or YouTube video */}
      <VideoSection />
      {/* Featured Events Section - Now controlled by feature flags */}
      <FeaturedEvents />
      {/* First row of card games */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl">
        {[
          {
            title: "Pokemon",
            href: "/products/pokemon",
            image: "/pokemon-logo.png",
          },
          {
            title: "Yu-Gi-Oh TCG",
            href: "/products/yugioh",
            image: "/yugioh-logo.png",
          },
          {
            title: "DBZ Super TCG",
            href: "/products/dragonball",
            image: "/dragonball.png",
            width: 220,
          },
        ].map((item) => (
          <div key={item.href} className="flex flex-col items-center group">
            <h2 className="text-2xl font-bold uppercase mb-1 group-hover:text-brand-gold transition-colors">
              {item.title}
            </h2>
            <Link
              href={item.href}
              className="text-brand-blue hover:text-brand-blue-light text-sm font-medium mb-4 transition-colors"
            >
              VIEW ALL
            </Link>
            <div className="bg-gray-900 rounded-lg p-4 w-full aspect-square flex items-center justify-center border border-transparent group-hover:border-brand-blue/30 transition-all shadow-lg hover:shadow-brand-blue/10">
              <Image
                src={item.image}
                alt={item.title}
                width={item.width || 280}
                height={140}
                className="object-contain transition-transform group-hover:scale-105"
              />
            </div>
          </div>
        ))}
      </div>
      {/* Second row of card games */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl">
        {[
          {
            title: "Digimon",
            href: "/products/digimon",
            image: "/digimon_card_game_logo.png",
          },
          {
            title: "One Piece",
            href: "/products/onepiece",
            image: "/one-piece-card-game.jpg",
            width: 220,
          },
          {
            title: "MetaZoo",
            href: "/products/metazoo",
            image: "/Metazoo-logo.png",
            width: 220,
          },
        ].map((item) => (
          <div key={item.href} className="flex flex-col items-center group">
            <h2 className="text-2xl font-bold uppercase mb-1 group-hover:text-brand-gold transition-colors">
              {item.title}
            </h2>
            <Link
              href={item.href}
              className="text-brand-blue hover:text-brand-blue-light text-sm font-medium mb-4 transition-colors"
            >
              VIEW ALL
            </Link>
            <div className="bg-gray-900 rounded-lg p-4 w-full aspect-square flex items-center justify-center border border-transparent group-hover:border-brand-blue/30 transition-all shadow-lg hover:shadow-brand-blue/10">
              <Image
                src={item.image}
                alt={item.title}
                width={item.width || 280}
                height={140}
                className="object-contain transition-transform group-hover:scale-105"
              />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-8 text-center">
        <h2 className="text-3xl font-bold mb-4 text-brand-gold">
          Why Choose MAV Collectibles?
        </h2>
        <div className="flex flex-col md:flex-row gap-6 justify-center mt-4">
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
            <div
              key={index}
              className="flex-1 max-w-md p-6 bg-gray-900 rounded-lg border border-brand-blue/10 hover:border-brand-blue/30 transition-colors shadow-lg"
            >
              <h3 className="text-xl font-semibold mb-2 text-brand-blue-light">
                {feature.title}
              </h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
      
      {/* Featured Products or other sections */}
      <ProductList />
    </div>
  );
}
