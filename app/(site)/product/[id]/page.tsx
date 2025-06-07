"use client";

import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ShoppingCart, ChevronLeft } from 'lucide-react';
import { useSquareProduct } from '@hooks/useSquareProduct';
import { useCart } from '@contexts/CartContext';
import { Button } from "@components/ui/button";
import { formatMoney } from '@utils/formatMoney';
import toast from 'react-hot-toast';

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data: product, isLoading, error } = useSquareProduct(id);
  const { addItem } = useCart();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#E6B325]"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500">Failed to load product</div>
      </div>
    );
  }

  const handleAddToCart = () => {
    if (!product.variations?.length) return;
    const mainVariation = product.variations[0];
    addItem({
      id: product.id,
      name: product.name,
      price: mainVariation.priceAmount,
      imageUrl: product.imageUrls?.[0] || '/images/placeholder.png',
    });
    toast.success(`${product.name} added to cart!`, {
      position: "top-right",
      duration: 2000,
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <button
        onClick={() => router.back()}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ChevronLeft className="w-5 h-5 mr-1" />
        Back
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative aspect-square max-w-[500px] mx-auto"
        >
          <Image
            src={product.imageUrls?.[0] || '/images/placeholder.png'}
            alt={product.name}
            fill
            className="object-contain rounded-lg"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-col"
        >
          <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
          <p className="text-2xl font-semibold text-[#E6B325] mb-6">
            {formatMoney(product.variations?.[0]?.priceAmount, product.variations?.[0]?.priceCurrency)}
          </p>
          <p className="text-gray-300 mb-8">{product.description}</p>

          <Button
            onClick={handleAddToCart}
            className="flex items-center justify-center gap-2 bg-[#E6B325] hover:bg-[#FFD966] text-black"
          >
            <ShoppingCart className="w-5 h-5" />
            Add to Cart
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
