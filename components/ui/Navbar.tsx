"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, ShoppingCart, Menu, X, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const mobileMenuVariants = {
    hidden: { opacity: 0, height: 0 },
    visible: {
      opacity: 1,
      height: "auto",
      transition: {
        duration: 0.3,
        staggerChildren: 0.05,
        when: "beforeChildren",
      },
    },
    exit: {
      opacity: 0,
      height: 0,
      transition: {
        duration: 0.2,
        when: "afterChildren",
      },
    },
  };

  const mobileItemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -10 },
  };

  return (
    <div className="sticky top-0 z-50 bg-black shadow-md">
      <nav className="sticky top-0 z-50 w-full bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-auto py-2 md:py-3">
            {/* Logo and brand - no animation */}
            <div className="flex-shrink-0 flex items-center justify-center">
              <Link href="/" className="flex items-center">
                <Image
                  src="/mav_collectibles.png"
                  alt="MAV Collectibles Logo"
                  width={400}
                  height={160}
                  className="h-auto w-40 sm:w-44 md:w-48 my-2"
                  priority
                />
              </Link>
            </div>

            {/* Desktop Navigation - only hover animations */}
            <div className="hidden md:flex items-center space-x-4">
              {[
                { href: "/products", label: "All Cards" },
                { href: "/products/pokemon", label: "Pokémon" },
                { href: "/products/yugioh", label: "Yu-Gi-Oh!" },
                { href: "/products/onepiece", label: "One Piece" },
                { href: "/products/dragonball", label: "Dragon Ball" },
              ].map((item) => (
                <motion.div
                  key={item.href}
                  initial={{ y: 0 }}
                  whileHover={{
                    y: -2,
                    color: "#E6B325",
                    transition: { duration: 0.2 },
                  }}
                  className="relative"
                >
                  <Link
                    href={item.href}
                    className="text-[#E6B325] font-semibold uppercase tracking-wide text-sm transition-colors px-2 py-1 drop-shadow-sm hover:text-[#FFD966]"
                  >
                    {item.label}
                  </Link>
                  <motion.div
                    className="absolute bottom-0 left-0 h-0.5 bg-[#E6B325]"
                    initial={{ width: "0%" }}
                    whileHover={{ width: "100%" }}
                    transition={{ duration: 0.3 }}
                  />
                </motion.div>
              ))}
            </div>

            {/* Search, Cart, and Menu - no animation */}
            <div className="flex items-center space-x-4">
              <button
                className="p-2 rounded-full text-white hover:bg-brand-blue/20 hover:text-[#E6B325] transition-colors"
                aria-label="Search"
              >
                <Search size={20} />
              </button>

              <Link
                href="/login"
                className="p-2 rounded-full text-white hover:bg-brand-blue/20 hover:text-[#E6B325] transition-colors"
              >
                <User size={20} />
              </Link>

              <Link
                href="/cart"
                className="p-2 rounded-full text-white hover:bg-brand-blue/20 hover:text-[#E6B325] relative transition-colors"
              >
                <ShoppingCart size={20} />
                <span className="absolute top-0 right-0 inline-flex items-center justify-center w-4 h-4 text-xs font-bold text-black bg-[#E6B325] rounded-full">
                  0
                </span>
              </Link>

              <button
                className="md:hidden p-2 rounded-full text-white hover:bg-brand-blue/20 hover:text-[#E6B325] transition-colors"
                onClick={toggleMenu}
                aria-label="Toggle menu"
              >
                {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu with AnimatePresence for exit animations */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              className="md:hidden overflow-hidden"
              variants={mobileMenuVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-black border-t border-[#E6B325]/10">
                {[
                  { href: "/products", label: "All Cards" },
                  { href: "/products/pokemon", label: "Pokémon" },
                  { href: "/products/yugioh", label: "Yu-Gi-Oh!" },
                  { href: "/products/onepiece", label: "One Piece" },
                  { href: "/products/dragonball", label: "Dragon Ball" },
                ].map((item) => (
                  <motion.div key={item.href} variants={mobileItemVariants}>
                    <Link
                      href={item.href}
                      className="block px-3 py-2 rounded-md text-base font-semibold uppercase text-[#E6B325] drop-shadow-sm hover:bg-[#E6B325]/10 hover:text-[#FFD966] transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </div>
  );
};

export default Navbar;
