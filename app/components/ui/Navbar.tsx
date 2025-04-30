"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, ShoppingCart, Menu, X, User, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSupabase } from "@contexts/SupabaseContext";
import { useCart } from '@contexts/CartContext';

const CartIcon = () => {
  const { totalItems } = useCart();
  const [isAnimating, setIsAnimating] = useState(false);
  const prevItemsRef = useRef(totalItems);

  useEffect(() => {
    if (totalItems > prevItemsRef.current) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 500);
      return () => clearTimeout(timer);
    }
    prevItemsRef.current = totalItems;
  }, [totalItems]);

  return (
    <Link
      href="/cart"
      className="p-2 rounded-full text-white hover:bg-brand-blue/20 hover:text-[#E6B325] relative transition-colors"
    >
      <motion.div
        animate={isAnimating ? {
          scale: [1, 1.2, 1],
          rotate: [0, -15, 15, -15, 0],
        } : {}}
        transition={{ duration: 0.5 }}
      >
        <ShoppingCart size={20} />
      </motion.div>
      <AnimatePresence mode="popLayout">
        {totalItems > 0 && (
          <motion.span
            key="cart-count"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="absolute top-0 right-0 inline-flex items-center justify-center w-4 h-4 text-xs font-bold text-black bg-[#E6B325] rounded-full"
          >
            {totalItems}
          </motion.span>
        )}
      </AnimatePresence>
    </Link>
  );
};

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { user, userProfile, signOut } = useSupabase();
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const profileButtonRef = useRef<HTMLButtonElement>(null);

  // Handle click outside for profile dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileDropdownRef.current &&
        profileButtonRef.current &&
        !profileDropdownRef.current.contains(event.target as Node) &&
        !profileButtonRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    };

    if (isProfileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileOpen]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    if (isProfileOpen) setIsProfileOpen(false);
  };

  const toggleProfile = () => {
    setIsProfileOpen(!isProfileOpen);
    if (isMenuOpen) setIsMenuOpen(false);
  };

  const handleSignOut = async () => {
    setIsProfileOpen(false);
    await signOut();
  };

  const hasAdminAccess = userProfile?.role && ['STAFF', 'MANAGER', 'ADMIN', 'OWNER'].includes(userProfile.role);

  const navigationItems = [
    { href: "/products", label: "All Cards" },
    { href: "/products/pokemon", label: "Pokémon" },
    { href: "/products/yugioh", label: "Yu-Gi-Oh!" },
    { href: "/products/onepiece", label: "One Piece" },
    { href: "/products/dragonball", label: "Dragon Ball" },
    ...(hasAdminAccess ? [{ href: "/admin", label: "Admin" }] : []),
  ];

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
    <div className="bg-black shadow-md">
      <nav className="w-full bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-auto py-2 md:py-3">
            {/* Logo and brand */}
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

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              {navigationItems.map((item) => (
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

            {/* Search, Profile, Cart, and Menu */}
            <div className="flex items-center space-x-4">
              <button
                className="p-2 rounded-full text-white hover:bg-brand-blue/20 hover:text-[#E6B325] transition-colors"
                aria-label="Search"
              >
                <Search size={20} />
              </button>

              {/* Profile Menu */}
              <div className="relative">
                <button
                  ref={profileButtonRef}
                  onClick={toggleProfile}
                  className={`p-2 rounded-full transition-colors ${
                    isProfileOpen 
                      ? 'bg-[#E6B325]/10 text-[#E6B325]' 
                      : 'text-white hover:bg-brand-blue/20 hover:text-[#E6B325]'
                  }`}
                  aria-label="Profile"
                  aria-expanded={isProfileOpen}
                >
                  <User size={20} />
                </button>

                {/* Profile Dropdown */}
                <AnimatePresence>
                  {isProfileOpen && (
                    <motion.div
                      ref={profileDropdownRef}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-48 bg-black border border-[#E6B325]/30 rounded-lg shadow-lg py-1 backdrop-blur-sm"
                    >
                      {user ? (
                        <>
                          <div className="px-4 py-2 border-b border-[#E6B325]/10">
                            <p className="text-sm font-medium text-[#E6B325] truncate">
                              {user.email}
                            </p>
                          </div>
                          <Link
                            href="/dashboard"
                            className="block px-4 py-2 text-sm text-[#E6B325] hover:bg-[#E6B325]/10 transition-colors"
                            onClick={() => setIsProfileOpen(false)}
                          >
                            Dashboard
                          </Link>
                          <Link
                            href="/profile"
                            className="block px-4 py-2 text-sm text-[#E6B325] hover:bg-[#E6B325]/10 transition-colors"
                            onClick={() => setIsProfileOpen(false)}
                          >
                            Profile Settings
                          </Link>
                          <button
                            onClick={handleSignOut}
                            className="w-full text-left px-4 py-2 text-sm text-[#E6B325] hover:bg-[#E6B325]/10 transition-colors flex items-center"
                          >
                            <LogOut size={16} className="mr-2" />
                            Sign Out
                          </button>
                        </>
                      ) : (
                        <Link
                          href="/login"
                          className="block px-4 py-2 text-sm text-[#E6B325] hover:bg-[#E6B325]/10 transition-colors"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          Sign In
                        </Link>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <CartIcon />

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

        {/* Mobile menu */}
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
                {navigationItems.map((item) => (
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