"use client";

import { useEffect, useState, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Star, ShoppingCart, ChevronLeft } from 'lucide-react';

interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  description: string;
  status: 'in_stock' | 'sale' | 'sold_out';
  salePrice?: number;
  stockQuantity: number;
  details: {
    releaseDate: string;
    manufacturer: string;
    contents: string[];
    features: string[];
  };
  reviews: Review[];
}

// Mock product data
const MOCK_PRODUCT: Product = {
  id: '1',
  name: 'Pokémon TCG: Crown Zenith Elite Trainer Box',
  price: 49.99,
  salePrice: 45.00,
  image: '/products/crown-zenith-elite.png',
  category: 'pokemon',
  description: 'The Legendary heroes Zacian and Zamazenta shine with new VSTAR Powers in this elite trainer box!',
  status: 'sale',
  stockQuantity: 5,
  details: {
    releaseDate: '2023-01-20',
    manufacturer: 'The Pokémon Company',
    contents: [
      "10 Pokémon TCG: Crown Zenith booster packs",
      "1 etched foil promo card featuring Lucario VSTAR",
      "65 card sleeves featuring Lucario",
      "45 Pokémon TCG Energy cards",
      "A player\\'s guide to the Crown Zenith expansion",
      "6 damage-counter dice",
      "1 competition-legal coin-flip die",
      "2 acrylic condition markers",
      "1 acrylic VSTAR marker",
      "A collector\\'s box to hold everything"
    ],
    features: [
      'Special VSTAR Powers',
      'Exclusive Promo Card',
      'Premium Accessories',
      'Collector\'s Storage'
    ]
  },
  reviews: [
    {
      id: '1',
      userId: 'user1',
      userName: 'John D.',
      rating: 5,
      comment: 'Amazing product! The card quality is excellent and the packaging is beautiful.',
      createdAt: '2024-02-15T10:00:00Z'
    },
    {
      id: '2',
      userId: 'user2',
      userName: 'Sarah M.',
      rating: 4,
      comment: 'Great value for money. The dice and markers are high quality.',
      createdAt: '2024-02-14T15:30:00Z'
    }
  ]
};

const IMAGE_CONFIG = {
  width: 500,
  height: 500,
  quality: 90,
} as const;

export default function ProductPage({ params }: { params: Promise<{ category: string; id: string }> }) {
  const resolvedParams = use(params);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    // Simulate API call to fetch product
    const timer = setTimeout(() => {
      setProduct(MOCK_PRODUCT);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [resolvedParams.category, resolvedParams.id]);

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

  if (!product) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#E6B325] mb-4">Product Not Found</h1>
          <Link
            href="/products"
            className="text-white hover:text-[#E6B325] transition-colors"
          >
            Return to Products
          </Link>
        </div>
      </div>
    );
  }

  const averageRating = product.reviews.reduce((acc, review) => acc + review.rating, 0) / product.reviews.length;

  return (
    <div className="min-h-[60vh] px-4 py-12">
      <div className="max-w-7xl mx-auto">
        <Link
          href="/products"
          className="inline-flex items-center text-[#E6B325] hover:text-[#FFD966] mb-8 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          Back to Products
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Image Container */}
          <div className="relative">
            {product.status === 'sale' && (
              <div className="absolute -top-5 left-0 z-30 bg-[#E6B325] text-black px-3 py-1 rounded-md text-sm font-bold shadow-lg">
                SALE
              </div>
            )}
            {/* Product Image */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="relative aspect-square rounded-xl overflow-hidden bg-gray-900/50 backdrop-blur-sm border border-gray-800/50"
            >
              {product.status === 'sold_out' && (
                <div className="absolute inset-0 z-20 bg-black/60 flex items-center justify-center">
                  <span className="text-white font-bold text-xl">SOLD OUT</span>
                </div>
              )}
              <Image
                src={product.image}
                alt={product.name}
                width={IMAGE_CONFIG.width}
                height={IMAGE_CONFIG.height}
                className="object-contain w-full h-full p-8"
                quality={IMAGE_CONFIG.quality}
                priority
              />
            </motion.div>
          </div>

          {/* Product Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col"
          >
            <h1 className="text-3xl font-bold text-white mb-4">{product.name}</h1>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center">
                {product.salePrice ? (
                  <>
                    <span className="text-2xl font-bold text-[#E6B325]">${product.salePrice.toFixed(2)}</span>
                    <span className="text-lg text-gray-500 line-through ml-2">${product.price.toFixed(2)}</span>
                  </>
                ) : (
                  <span className="text-2xl font-bold text-[#E6B325]">${product.price.toFixed(2)}</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${i < Math.round(averageRating) ? 'text-[#E6B325] fill-[#E6B325]' : 'text-gray-600'}`}
                  />
                ))}
                <span className="text-gray-400 text-sm ml-2">({product.reviews.length} reviews)</span>
              </div>
            </div>

            <p className="text-gray-300 mb-8">{product.description}</p>

            {product.status !== 'sold_out' && (
              <div className="flex items-center gap-4 mb-8">
                <select
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="bg-gray-900/50 border border-[#E6B325]/30 text-white py-2 px-4 rounded-lg focus:outline-none focus:border-[#E6B325] transition-colors"
                >
                  {[...Array(Math.min(10, product.stockQuantity))].map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1}
                    </option>
                  ))}
                </select>
                <button
                  className="flex-1 bg-[#E6B325] hover:bg-[#FFD966] text-black font-semibold py-2 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="w-5 h-5" />
                  Add to Cart
                </button>
              </div>
            )}

            {/* Product Details */}
            <div className="border-t border-gray-800 pt-8">
              <h2 className="text-xl font-semibold text-white mb-4">Product Details</h2>
              <dl className="grid grid-cols-1 gap-4">
                <div>
                  <dt className="text-gray-400">Release Date</dt>
                  <dd className="text-white">{new Date(product.details.releaseDate).toLocaleDateString()}</dd>
                </div>
                <div>
                  <dt className="text-gray-400">Manufacturer</dt>
                  <dd className="text-white">{product.details.manufacturer}</dd>
                </div>
                <div>
                  <dt className="text-gray-400 mb-2">Contents</dt>
                  <dd className="text-white">
                    <ul className="list-disc list-inside space-y-1">
                      {product.details.contents.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </dd>
                </div>
              </dl>
            </div>
          </motion.div>
        </div>

        {/* Reviews Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-16 border-t border-gray-800 pt-12"
        >
          <h2 className="text-2xl font-bold text-white mb-8">Customer Reviews</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {product.reviews.map((review) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-900/50 backdrop-blur-sm border border-gray-800/50 rounded-xl p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="font-medium text-white">{review.userName}</span>
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${i < review.rating ? 'text-[#E6B325] fill-[#E6B325]' : 'text-gray-600'}`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-gray-300">{review.comment}</p>
                <time className="block mt-4 text-sm text-gray-500">
                  {new Date(review.createdAt).toLocaleDateString()}
                </time>
              </motion.div>
            ))}
          </div>

          {/* Add Review Button */}
          <div className="mt-8 text-center">
            <button
              className="bg-[#E6B325]/10 hover:bg-[#E6B325]/20 text-[#E6B325] font-semibold py-3 px-8 rounded-lg transition-colors"
            >
              Write a Review
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 