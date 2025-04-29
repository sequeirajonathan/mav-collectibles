'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ProductCard } from '@components/ui/ProductCard';
import { Filter, SlidersHorizontal, ArrowDownWideNarrow } from 'lucide-react';
import { useSquareProducts } from '@hooks/useSquareProducts';
import { useParams } from 'next/navigation';

const IMAGE_CONFIG = {
  width: 280,
  height: 280,
  quality: 90,
} as const;

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

export default function ProductCategoryPage() {
  const params = useParams();
  const category = params.category as string;
  const { data: products = [], isLoading, isError } = useSquareProducts(category);

  const categoryTitle = categoryTitles[category] || "Trading Card Game";
  const categoryImage = categoryImages[category];

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#E6B325]"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-center text-red-500">
        Failed to load products.
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] px-4 py-12 max-w-[1400px] mx-auto">
      <div className="text-center mb-12">
        {categoryImage && (
          <div className="mb-8 flex justify-center">
            <Image
              src={categoryImage}
              alt={categoryTitle}
              width={240}
              height={120}
              className="object-contain"
            />
          </div>
        )}
        <h1 className="text-3xl sm:text-4xl font-bold text-[#E6B325] mb-4">
          {categoryTitle}
        </h1>
        <p className="text-gray-300 max-w-2xl mx-auto">
          Browse our selection of {categoryTitle.toLowerCase()} products.
          We offer competitive prices and authentic products.
        </p>
      </div>

      {products.length > 0 && (
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-gray-300">{products.length} products</span>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-3 py-2 rounded-md bg-gray-800 text-gray-300 hover:bg-gray-700">
              <Filter size={16} />
              <span>Filter</span>
            </button>
            <button className="flex items-center gap-2 px-3 py-2 rounded-md bg-gray-800 text-gray-300 hover:bg-gray-700">
              <ArrowDownWideNarrow size={16} />
              <span>Sort</span>
            </button>
          </div>
        </div>
      )}

      {products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-8">
          {products.map((product) => (
            <ProductCard 
              key={product.id} 
              product={{
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.imageUrls?.[0] || '',
                category: product.category,
                description: product.description,
                status: product.status,
                stockQuantity: 0, // TODO: Get from Square API
              }}
              imageConfig={IMAGE_CONFIG}
            />
          ))}
        </div>
      ) : (
        <div className="text-center bg-gray-900 rounded-lg p-10">
          <div className="inline-flex justify-center items-center w-16 h-16 rounded-full bg-gray-800 mb-4">
            <SlidersHorizontal size={24} className="text-[#E6B325]" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-3">No Products Found</h2>
          <p className="text-gray-300 mb-8 max-w-md mx-auto">
            Sorry, there are no products available in this collection at the moment.
            Please check back later or browse other categories.
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
        </div>
      )}
    </div>
  );
}
