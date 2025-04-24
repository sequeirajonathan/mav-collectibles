"use client";

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';

const categoryTitles: Record<string, string> = {
  pokemon: "Pokémon Trading Card Game",
  yugioh: "Yu-Gi-Oh! Trading Card Game",
  onepiece: "One Piece Card Game",
  dragonball: "Dragon Ball Super Card Game",
  digimon: "Digimon Card Game",
  metazoo: "MetaZoo Trading Card Game",
};

const categoryImages: Record<string, string> = {
  pokemon: "/pokemon-logo.png",
  yugioh: "/yugioh-logo.png",
  onepiece: "/one-piece-card-game.jpg",
  dragonball: "/dragonball.png",
  digimon: "/digimon_card_game_logo.png",
  metazoo: "/Metazoo-logo.png",
};

export default function ProductCategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const resolvedParams = use(params);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading products
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [resolvedParams.category]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="h-8 w-48 bg-gray-800 rounded mx-auto mb-4" />
          <div className="h-4 w-64 bg-gray-800 rounded mx-auto" />
        </div>
      </div>
    );
  }

  const categoryTitle = categoryTitles[resolvedParams.category] || "Trading Card Game";
  const categoryImage = categoryImages[resolvedParams.category];

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-2xl mx-auto"
      >
        {categoryImage && (
          <div className="mb-8 flex justify-center">
            <Image
              src={categoryImage}
              alt={categoryTitle}
              width={200}
              height={100}
              className="object-contain"
            />
          </div>
        )}
        
        <h1 className="text-3xl sm:text-4xl font-bold text-[#E6B325] mb-4">
          {categoryTitle}
        </h1>
        
        <p className="text-gray-300 text-lg mb-8">
          Sorry, there are no products available in this collection at the moment.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/products"
            className="px-6 py-3 bg-[#E6B325] hover:bg-[#FFD966] text-black rounded-lg font-medium transition-colors"
          >
            View All Products
          </Link>
          <Link
            href="/"
            className="px-6 py-3 border border-[#E6B325] text-[#E6B325] hover:bg-[#E6B325]/10 rounded-lg font-medium transition-colors"
          >
            Return Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
} 