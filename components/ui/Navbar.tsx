"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, ShoppingCart, Menu, X, User, LogOut, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSupabase } from "@contexts/SupabaseContext";
import { useCart } from '@contexts/CartContext';
import { CATEGORY_GROUPS, CATEGORY_MAPPING, COLLECTIBLES_MAPPING, SUPPLIES_MAPPING, EVENTS_MAPPING } from '@const/categories';
import { Category } from '@interfaces/categories';
import { useSearchParams } from 'next/navigation';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchParams = useSearchParams();
  const { user, userProfile, signOut } = useSupabase();
  const { totalItems } = useCart();
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const profileButtonRef = useRef<HTMLButtonElement>(null);
  const dropdownRefs = useRef<Record<string, HTMLDivElement | null>>({});

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

      // Check if click is outside any dropdown
      const clickedOutsideAllDropdowns = Object.values(dropdownRefs.current).every(
        ref => !ref?.contains(event.target as Node)
      );
      if (clickedOutsideAllDropdowns) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const navigationItems = hasAdminAccess ? [{ href: "/admin", label: "Admin" }] : [];

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

  const toggleGroup = (groupName: string) => {
    setExpandedGroup(expandedGroup === groupName ? null : groupName);
  };

  // Group TCG categories for mobile
  const getTopTCGCategories = (categories: Category[]) => {
    const topGames = ['pokemon', 'yugioh', 'magic', 'dragonball', 'onepiece'];
    return categories.filter(cat => topGames.includes(cat.routeName));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      const params = new URLSearchParams(searchParams.toString());
      params.set('search', searchTerm.trim());
      // Clear categoryId when searching to avoid conflicts
      params.delete('categoryId');
      window.location.href = `/products?${params.toString()}`;
      setSearchTerm("");
    }
  };

  const handleCategoryClick = (groupName: string, category?: Category) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('group', groupName);
    
    if (category) {
      let squareId: string | undefined;
      
      switch (groupName) {
        case "TCG":
          squareId = CATEGORY_MAPPING[category.squareCategory]?.squareId;
          break;
        case "Collectibles":
          squareId = COLLECTIBLES_MAPPING[category.squareCategory]?.squareId;
          break;
        case "Supplies & Grading":
          squareId = SUPPLIES_MAPPING[category.squareCategory]?.squareId;
          break;
        case "Events":
          squareId = EVENTS_MAPPING[category.squareCategory]?.squareId;
          break;
      }

      if (squareId) {
        params.set('categoryId', squareId);
        // Clear search when selecting a category
        params.delete('search');
      }
    } else {
      // If no specific category is selected, remove the categoryId parameter
      params.delete('categoryId');
    }

    window.location.href = `/products?${params.toString()}`;
    setActiveDropdown(null);
  };

  return (
    <div className="bg-black shadow-md overflow-x-hidden">
      <nav className="w-full bg-black">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex flex-wrap justify-between items-center h-auto py-2 md:py-3">
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

            {/* Desktop Navigation and Search */}
            <div className="flex-1 flex items-center space-x-2 sm:space-x-4 justify-center flex-wrap">
              {/* Category Group Dropdowns */}
              {CATEGORY_GROUPS.map((group) => {
                const isTCG = group.name === "TCG";
                const categories = isTCG ? getTopTCGCategories(group.categories) : group.categories;

                return (
                  <div key={group.name} className="relative" ref={(el) => {
                    if (el) {
                      dropdownRefs.current[group.name] = el;
                    }
                  }}>
                    <motion.button
                      onClick={() => setActiveDropdown(activeDropdown === group.name ? null : group.name)}
                      className="text-[#E6B325] font-semibold uppercase tracking-wide text-sm transition-colors px-2 py-1 drop-shadow-sm hover:text-[#FFD966] flex items-center"
                      initial={{ y: 0 }}
                      whileHover={{ y: -2 }}
                    >
                      {group.name}
                      <ChevronDown size={16} className={`ml-1 transition-transform ${activeDropdown === group.name ? 'rotate-180' : ''}`} />
                    </motion.button>

                    <AnimatePresence>
                      {activeDropdown === group.name && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          transition={{ duration: 0.2 }}
                          className="absolute top-full left-0 mt-2 w-48 bg-black border border-[#E6B325]/30 rounded-lg shadow-lg py-1 backdrop-blur-sm z-50"
                        >
                          {categories.map((category) => (
                            <button
                              key={category.routeName}
                              onClick={() => handleCategoryClick(group.name, category)}
                              className="w-full text-left px-4 py-2 text-sm text-[#E6B325] hover:bg-[#E6B325]/10 transition-colors"
                            >
                              {category.displayName}
                            </button>
                          ))}
                          {isTCG && (
                            <button
                              onClick={() => handleCategoryClick(group.name)}
                              className="w-full text-left px-4 py-2 text-sm text-[#E6B325]/80 hover:text-[#E6B325] hover:bg-[#E6B325]/10 transition-colors"
                            >
                              View All TCG
                            </button>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}

              {/* Admin Link */}
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

              {/* Search input - always visible */}
              <div className="relative flex items-center" style={{ minWidth: 0 }}>
                <form
                  onSubmit={handleSearch}
                  className="flex items-center bg-black border border-[#E6B325]/80 rounded-full overflow-hidden shadow-lg"
                  style={{ width: 240, position: 'relative', zIndex: 30 }}
                >
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search products..."
                    className="bg-transparent text-white px-4 py-1 w-full focus:outline-none placeholder:text-gray-400"
                    style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
                  />
                  <button
                    type="submit"
                    className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-[#E6B325] hover:text-[#FFD966] transition-colors bg-transparent border-none outline-none focus:outline-none"
                    style={{ background: 'none', border: 'none', outline: 'none' }}
                    tabIndex={0}
                  >
                    <Search size={20} />
                  </button>
                </form>
              </div>
            </div>

            {/* Right nav items */}
            <div className="flex items-center space-x-2 sm:space-x-4 relative">
              {/* Profile Menu */}
              <motion.div className="relative">
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
              </motion.div>

              <Link
                href="/cart"
                className="p-2 rounded-full text-white hover:bg-brand-blue/20 hover:text-[#E6B325] relative transition-colors"
              >
                <ShoppingCart size={20} />
                {totalItems > 0 && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center w-4 h-4 text-xs font-bold text-black bg-[#E6B325] rounded-full">
                    {totalItems}
                  </span>
                )}
              </Link>

              <motion.button
                className="md:hidden p-2 rounded-full text-white hover:bg-brand-blue/20 hover:text-[#E6B325] transition-colors"
                onClick={toggleMenu}
                aria-label="Toggle menu"
              >
                {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </motion.button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              className="fixed inset-0 z-50 bg-black overflow-y-auto md:hidden"
              variants={mobileMenuVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-black border-t border-[#E6B325]/10 min-h-screen flex flex-col">
                {CATEGORY_GROUPS.map((group) => {
                  const isTCG = group.name === "TCG";
                  return (
                    <div key={group.name} className="space-y-1">
                      <button
                        onClick={() => toggleGroup(group.name)}
                        className="w-full flex items-center justify-between px-3 py-2 text-base font-semibold uppercase text-[#E6B325] hover:bg-[#E6B325]/10 transition-colors"
                      >
                        {group.name}
                        <ChevronDown
                          size={20}
                          className={`transition-transform duration-200 ${expandedGroup === group.name ? 'rotate-180' : ''}`}
                        />
                      </button>
                      <AnimatePresence>
                        {expandedGroup === group.name && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="pl-4 space-y-1">
                              {isTCG ? (
                                <>
                                  {getTopTCGCategories(group.categories).map((category) => (
                                    <motion.div
                                      key={category.routeName}
                                      initial={{ opacity: 0, x: -10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      exit={{ opacity: 0, x: -10 }}
                                      transition={{ duration: 0.2 }}
                                    >
                                      <Link
                                        href={`/products?group=${group.name}&category=${category.squareCategory}`}
                                        className="block px-3 py-2 text-base font-medium text-[#E6B325] drop-shadow-sm hover:bg-[#E6B325]/10 hover:text-[#FFD966] transition-colors"
                                        onClick={() => setIsMenuOpen(false)}
                                      >
                                        {category.displayName}
                                      </Link>
                                    </motion.div>
                                  ))}
                                  <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    transition={{ duration: 0.2 }}
                                  >
                                    <Link
                                      href="/products"
                                      className="block px-3 py-2 text-base font-medium text-[#E6B325]/80 hover:text-[#E6B325] transition-colors"
                                      onClick={() => setIsMenuOpen(false)}
                                    >
                                      View All TCG
                                    </Link>
                                  </motion.div>
                                </>
                              ) : (
                                group.categories.map((category) => (
                                  <motion.div
                                    key={category.routeName}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    transition={{ duration: 0.2 }}
                                  >
                                    <Link
                                      href={`/products/${category.routeName}`}
                                      className="block px-3 py-2 text-base font-medium text-[#E6B325] drop-shadow-sm hover:bg-[#E6B325]/10 hover:text-[#FFD966] transition-colors"
                                      onClick={() => setIsMenuOpen(false)}
                                    >
                                      {category.displayName}
                                    </Link>
                                  </motion.div>
                                ))
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}

                {/* Admin Link in Mobile Menu */}
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