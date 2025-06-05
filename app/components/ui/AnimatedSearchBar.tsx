"use client";

import React, { useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Search } from "lucide-react";
import { Button } from "@components/ui/button";
import { useRouter } from "next/navigation";

export function AnimatedSearchBar() {
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();
  const { scrollY } = useScroll();
  
  // Transform scroll position to opacity and y position
  const opacity = useTransform(scrollY, [0, 100], [0, 1]);
  const y = useTransform(scrollY, [0, 100], [-20, 0]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    router.replace(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    setSearchTerm("");
  };

  return (
    <motion.div
      style={{ opacity, y }}
      className="absolute top-0 left-0 right-0 z-10 px-4 py-2 bg-black/80 backdrop-blur-sm border-b border-[#E6B325]/10"
    >
      <form
        onSubmit={handleSearch}
        className="max-w-7xl mx-auto flex items-center bg-black border border-[#E6B325]/80 rounded-full overflow-hidden"
      >
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search products..."
          className="bg-transparent text-white px-4 py-2 w-full focus:outline-none focus:ring-0 focus:border-none"
        />
        <Button
          type="submit"
          className="p-2 text-[#E6B325] bg-transparent hover:bg-transparent focus:bg-transparent border-none shadow-none focus:shadow-none"
          style={{ boxShadow: 'none', border: 'none' }}
        >
          <Search size={20} />
        </Button>
      </form>
    </motion.div>
  );
} 