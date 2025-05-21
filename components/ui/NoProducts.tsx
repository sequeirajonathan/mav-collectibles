import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShoppingBag } from 'lucide-react';
import React, { useState, useEffect } from 'react';

export function NoProducts() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return (
    <motion.div 
      initial={false}
      animate={mounted ? { opacity: 1, y: 0 } : false}
      className="flex flex-col items-center justify-center min-h-[40vh] text-center px-4"
    >
      <div className="mb-6">
        <ShoppingBag className="w-16 h-16 text-[#E6B325]" />
      </div>
      <h2 className="text-2xl font-bold text-[#E6B325] mb-4">
        No Products Found
      </h2>
      <p className="text-gray-400 mb-8 max-w-md">
        We couldn&apos;t find any products in this category. Check back later or explore our other collections.
      </p>
      <Link 
        href="/category/tcg" 
        className="inline-flex items-center px-6 py-3 rounded-lg bg-[#E6B325] text-black font-semibold hover:bg-[#c49920] transition-colors"
      >
        Continue Shopping
      </Link>
    </motion.div>
  );
} 