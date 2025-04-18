"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function CartPage() {
  const [isCartEmpty, setIsCartEmpty] = useState(true);
  
  // This is a placeholder for actual cart logic
  // In a real implementation, you would fetch cart items from your state management or API
  useEffect(() => {
    // Check if cart is empty - replace with your actual cart logic
    // For now, we're just setting it to true (empty)
    setIsCartEmpty(true);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <h1 className="text-4xl font-bold mb-8 text-white">SHOPPING CART</h1>
      
      {isCartEmpty ? (
        <div className="text-center">
          <p className="text-xl mb-8 text-white">Your cart is currently empty.</p>
          <Link 
            href="/" 
            className="inline-block px-8 py-3 bg-[#E6B325] text-black font-medium rounded hover:bg-[#FFD966] transition-colors"
          >
            CONTINUE BROWSING
          </Link>
        </div>
      ) : (
        // This will be your cart items display when you implement it
        <div className="w-full max-w-4xl">
          {/* Cart items will go here */}
        </div>
      )}
    </div>
  );
} 