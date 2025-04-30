"use client";

import Link from "next/link";
import Image from "next/image";
import { Minus, Plus, Trash2, ImageIcon } from "lucide-react";
import { useCart } from "@contexts/CartContext";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import type { PanInfo } from "framer-motion";

interface CartItemType {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

const ImagePlaceholder = () => {
  return (
    <motion.div
      className="w-full h-full bg-gray-800/50 rounded-lg flex items-center justify-center"
      initial={{ opacity: 0.6 }}
      animate={{ 
        opacity: [0.6, 0.8, 0.6],
        scale: [1, 1.05, 1],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      <ImageIcon className="w-8 h-8 text-gray-400" />
    </motion.div>
  );
};

export default function CartPage() {
  const { items, removeItem, updateQuantity, totalItems, totalPrice } = useCart();

  const handleQuantityChange = (itemId: string, currentQuantity: number, newQuantity: number) => {
    if (newQuantity >= 1) {
      updateQuantity(itemId, newQuantity);
    }
  };

  const CartItem = ({ item }: { item: CartItemType }) => {
    const x = useMotionValue(0);
    const background = useTransform(
      x,
      [-100, 0, 100],
      ["rgba(239, 68, 68, 0.2)", "rgba(0, 0, 0, 0)", "rgba(0, 0, 0, 0)"]
    );

    const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (Math.abs(info.offset.x) > 100) {
        removeItem(item.id);
      }
    };

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="bg-gray-900/50 backdrop-blur-sm border border-gray-800/50 rounded-xl overflow-hidden"
      >
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.7}
          onDragEnd={handleDragEnd}
          style={{ x, background }}
          className="p-4 relative"
        >
          <div className="absolute inset-y-0 left-0 flex items-center justify-start pl-4 text-red-500 opacity-50">
            <Trash2 size={24} />
          </div>
          <div className="flex items-center gap-4">
            <div className="relative w-24 h-24 rounded-lg overflow-hidden">
              {item.imageUrl ? (
                <Image
                  src={item.imageUrl}
                  alt={item.name}
                  fill
                  className="object-contain"
                  sizes="96px"
                />
              ) : (
                <ImagePlaceholder />
              )}
            </div>
            <div className="flex-grow">
              <h3 className="text-lg font-medium text-white">{item.name}</h3>
              <p className="text-[#E6B325] font-semibold">${item.price.toFixed(2)}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleQuantityChange(item.id, item.quantity, item.quantity - 1)}
                className={`p-1 rounded-lg ${
                  item.quantity <= 1
                    ? 'bg-gray-800/30 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-800/50 text-white hover:bg-gray-700/50'
                } transition-colors`}
                disabled={item.quantity <= 1}
              >
                <Minus size={16} />
              </button>
              <span className="w-8 text-center text-white">{item.quantity}</span>
              <button
                onClick={() => handleQuantityChange(item.id, item.quantity, item.quantity + 1)}
                className="p-1 rounded-lg bg-gray-800/50 text-white hover:bg-gray-700/50 transition-colors"
              >
                <Plus size={16} />
              </button>
              <button
                onClick={() => removeItem(item.id)}
                className="p-1 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors ml-2 lg:block hidden"
                aria-label="Remove item"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <h1 className="text-4xl font-bold mb-8 text-white">SHOPPING CART</h1>
        <div className="text-center">
          <p className="text-xl mb-8 text-white">Your cart is currently empty.</p>
          <Link 
            href="/products" 
            className="inline-block px-8 py-3 bg-[#E6B325] text-black font-medium rounded hover:bg-[#FFD966] transition-colors"
          >
            CONTINUE BROWSING
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] px-4 py-12">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-white text-center">SHOPPING CART</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-8">
            <div className="space-y-4">
              <AnimatePresence>
                {items.map((item) => (
                  <CartItem key={item.id} item={item} />
                ))}
              </AnimatePresence>
            </div>
            <div className="mt-4 text-sm text-gray-400 text-center md:hidden">
              Swipe left on an item to delete
            </div>
          </div>

          {/* Cart Summary */}
          <div className="lg:col-span-4">
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800/50 rounded-xl p-6 sticky top-4">
              <h2 className="text-xl font-semibold text-white mb-4">Cart Summary</h2>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-gray-300">
                  <span>Items ({totalItems})</span>
                  <span>${totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Shipping</span>
                  <span>Free</span>
                </div>
                <div className="border-t border-gray-800 pt-2 mt-2">
                  <div className="flex justify-between text-white font-semibold">
                    <span>Total</span>
                    <span>${totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <button
                className="w-full bg-[#E6B325] hover:bg-[#FFD966] text-black font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Proceed to Checkout
              </button>
              <Link
                href="/products"
                className="block text-center mt-4 text-[#E6B325] hover:text-[#FFD966] transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 