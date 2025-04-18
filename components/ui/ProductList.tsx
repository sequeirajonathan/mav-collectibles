"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

// Define a type for our product
interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
}

export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProducts() {
      try {
        // For now, use mock data instead of fetching from an API
        // Replace this with your actual API call when it's ready
        const mockProducts: Product[] = [
          {
            id: '1',
            name: 'Charizard Holo Card',
            price: 299.99,
            image: '/prismatic.jpg',
            category: 'pokemon'
          },
          {
            id: '2',
            name: 'Blue-Eyes White Dragon',
            price: 149.99,
            image: '/prismatic.jpg',
            category: 'yugioh'
          },
          {
            id: '3',
            name: 'Goku Ultra Instinct',
            price: 89.99,
            image: '/prismatic.jpg',
            category: 'dragonball'
          },
          {
            id: '4',
            name: 'Luffy Gear 5',
            price: 129.99,
            image: '/prismatic.jpg',
            category: 'onepiece'
          },
        ];
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setProducts(mockProducts);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Failed to load products. Please try again later.');
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold text-[#E6B325] mb-8 text-center">Featured Products</h2>
        <div className="flex justify-center">
          <p className="text-white">Loading products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold text-[#E6B325] mb-8 text-center">Featured Products</h2>
        <div className="flex justify-center">
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold text-[#E6B325] mb-8 text-center">Featured Products</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map(product => (
          <Link href={`/products/${product.category}/${product.id}`} key={product.id}>
            <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800 hover:border-[#E6B325]/50 transition-all shadow-lg hover:shadow-[#E6B325]/10">
              <div className="relative h-48">
                <Image 
                  src={product.image} 
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-4">
                <h3 className="text-white font-semibold truncate">{product.name}</h3>
                <p className="text-[#E6B325] mt-2">${product.price.toFixed(2)}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
      
      <div className="mt-8 text-center">
        <Link 
          href="/products" 
          className="inline-block px-6 py-3 bg-[#E6B325] text-black font-medium rounded hover:bg-[#FFD966] transition-colors"
        >
          View All Products
        </Link>
      </div>
    </div>
  );
} 