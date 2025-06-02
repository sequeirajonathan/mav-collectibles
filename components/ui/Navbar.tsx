"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  ShoppingCart,
  Menu,
  X,
  User,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@contexts/AuthContext";
import { useCart } from "@contexts/CartContext";
import {
  CATEGORY_GROUPS,
} from "@const/categories";
import { SquareCategory } from "@interfaces/categories";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Button } from "@components/ui/button";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { user, userProfile, isAdmin, isStaff, isManager, isOwner, signOut } = useAuth();
  const { totalItems } = useCart();
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const profileButtonRef = useRef<HTMLButtonElement>(null);
  const dropdownRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Debug logging for auth state
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_DEBUG === 'true') {
      console.log('🔐 Navbar Auth State:', {
        user: user?.email,
        userProfile,
        isAdmin,
        isStaff,
        isManager,
        isOwner
      });
    }
  }, [user, userProfile, isAdmin, isStaff, isManager, isOwner]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        profileDropdownRef.current &&
        profileButtonRef.current &&
        !profileDropdownRef.current.contains(e.target as Node) &&
        !profileButtonRef.current.contains(e.target as Node)
      ) {
        setIsProfileOpen(false);
      }
      const clickedOutsideAll = Object.values(dropdownRefs.current).every(
        (ref) => !ref?.contains(e.target as Node)
      );
      if (clickedOutsideAll) setActiveDropdown(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen((o) => {
      const newState = !o;
      if (!newState) setExpandedGroup(null);
      return newState;
    });
    if (isProfileOpen) setIsProfileOpen(false);
  };
  const toggleProfile = () => {
    setIsProfileOpen((o) => !o);
    if (isMenuOpen) setIsMenuOpen(false);
  };
  const handleSignOut = async () => {
    try {
      if (process.env.NEXT_PUBLIC_DEBUG === 'true') {
        console.log('🔐 Navbar - Starting sign out process');
      }

      setIsProfileOpen(false);
      setActiveDropdown(null);
      setExpandedGroup(null);
      
      if (process.env.NEXT_PUBLIC_DEBUG === 'true') {
        console.log('🔐 Navbar - Calling AuthContext signOut');
      }
      
      await signOut();
      
      if (process.env.NEXT_PUBLIC_DEBUG === 'true') {
        console.log('🔐 Navbar - Sign out completed successfully');
      }
    } catch (error) {
      if (process.env.NEXT_PUBLIC_DEBUG === 'true') {
        console.error('🔐 Navbar - Sign out error:', error);
      }
    }
  };
  const hasAdminAccess = isAdmin || isStaff || isManager || isOwner;
  const navigationItems = hasAdminAccess
    ? [{ href: "/admin", label: "Admin" }]
    : [];

  const mobileMenuVariants = {
    hidden: { opacity: 0, height: 0 },
    visible: {
      opacity: 1,
      height: "auto",
      transition: { duration: 0.3, when: "beforeChildren" },
    },
    exit: { opacity: 0, height: 0, transition: { duration: 0.2 } },
  };
  const mobileItemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -10 },
  };

  const toggleGroup = (g: string) =>
    setExpandedGroup((cur) => (cur === g ? null : g));

  const getTopTCGCategories = (cats: SquareCategory[]) => {
    const top = [
      "pokemon",
      "pokemonsingles",
      "yugioh",
      "magic",
      "dragonball",
      "onepiece",
      "starwars",
      "lorcana"
    ];
    return cats.filter((c) => top.includes(c.slug));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    router.replace(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    setSearchTerm("");
    setIsMenuOpen(false);
  };

  const handleCategoryClick = (group: string, category?: SquareCategory) => {
    const p = new URLSearchParams(searchParams.toString());
    p.set("group", group);
    p.delete("q");
    if (category) {
      router.replace(`/category/${category.slug}?${p.toString()}`);
    } else {
      router.replace(`/category/tcg`);
    }
    setActiveDropdown(null);
    setIsMenuOpen(false);
  };

  // Close all menus/accordions on route change
  useEffect(() => {
    setIsMenuOpen(false);
    setIsProfileOpen(false);
    setExpandedGroup(null);
    setActiveDropdown(null);
  }, [pathname]);

  return (
    <div className="bg-black shadow-md" key={`navbar-${hasAdminAccess}`}>
      <nav className="w-full bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-2 md:py-3">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="flex items-center">
                <Image
                  src="/mav_collectibles.png"
                  alt="MAV Collectibles Logo"
                  width={400}
                  height={160}
                  className="w-40 sm:w-44 md:w-48"
                  priority
                />
              </Link>
            </div>

            {/* Desktop nav + search (hidden on mobile) */}
            <div className="hidden min-[1110px]:flex min-[1110px]:flex-1 items-center space-x-4 justify-center">
              {CATEGORY_GROUPS.filter(group => group.name !== "Events").map((group) => {
                const isTCG = group.name === "TCG";
                const cats = isTCG
                  ? getTopTCGCategories(group.categories)
                  : group.categories;
                return (
                    <div
                    key={group.name}
                    className="relative"
                    ref={(el) => {
                      if (el) dropdownRefs.current[group.name] = el;
                    }}
                  >
                    <Button
                      onClick={() =>
                        setActiveDropdown((cur) =>
                          cur === group.name ? null : group.name
                        )
                      }
                      className="text-[#E6B325] font-semibold uppercase text-sm px-2 py-1 flex items-center hover:text-[#FFD966]"
                    >
                      {group.name}
                      <ChevronDown
                        size={16}
                        className={`ml-1 transition-transform ${
                          activeDropdown === group.name ? "rotate-180" : ""
                        }`}
                      />
                    </Button>
                    <AnimatePresence>
                    {activeDropdown === group.name && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          transition={{ duration: 0.2 }}
                          className="absolute top-full left-0 mt-2 w-48 bg-black border border-[#E6B325]/30 rounded-lg shadow-lg py-1 z-50"
                        >
                          {cats.map((cat) => (
                            <Button
                              key={cat.slug}
                              onClick={() =>
                                handleCategoryClick(group.name, cat)
                              }
                              className="w-full text-left px-4 py-2 text-sm text-[#E6B325] hover:bg-[#E6B325]/10"
                            >
                              {cat.displayName}
                            </Button>
                          ))}
                          {isTCG && (
                            <Button
                              onClick={() =>
                                handleCategoryClick("TCG")
                              }
                              className="w-full text-left px-4 py-2 text-sm text-[#E6B325]/80 hover:bg-[#E6B325]/10"
                            >
                              View All TCG
                            </Button>
                          )}
                        </motion.div>
                    )}
                    </AnimatePresence>
                  </div>
                );
              })}

              <Link
                href="/events"
                className="text-[#E6B325] font-semibold uppercase text-sm px-2 py-1 hover:text-[#FFD966]"
              >
                Events
              </Link>

              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-[#E6B325] font-semibold uppercase text-sm px-2 py-1 hover:text-[#FFD966]"
                >
                  {item.label}
                </Link>
              ))}

              {/* Search */}
              <form
                onSubmit={handleSearch}
                className="flex items-center bg-black border border-[#E6B325]/80 rounded-full overflow-hidden"
                style={{ width: 240 }}
              >
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search products..."
                  className="bg-transparent text-white px-4 py-1 w-full focus:outline-none focus:ring-0 focus:border-none"
                />
                <Button
                  type="submit"
                  className="p-2 text-[#E6B325] bg-transparent hover:bg-transparent focus:bg-transparent border-none shadow-none focus:shadow-none"
                  style={{ boxShadow: 'none', border: 'none' }}
                >
                  <Search size={20} />
                </Button>
              </form>
            </div>

            {/* Profile, Cart & Mobile toggle */}
            <div className="flex items-center space-x-4">
              {/* Profile */}
              <div className="relative">
                <Button
                  ref={profileButtonRef}
                  onClick={toggleProfile}
                  className={`p-2 rounded-full transition-colors ${
                    isProfileOpen
                      ? "bg-[#E6B325]/10 text-[#E6B325]"
                      : "text-white hover:bg-brand-blue/20 hover:text-[#E6B325]"
                  }`}
                >
                  <User size={20} />
                </Button>
                <AnimatePresence>
                  {isProfileOpen && (
                    <motion.div
                      ref={profileDropdownRef}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-48 bg-black border border-[#E6B325]/30 rounded-lg shadow-lg py-1 z-50"
                    >
                      {user ? (
                        <>
                          <div className="px-4 py-2 border-b border-[#E6B325]/10">
                            <p className="text-sm text-[#E6B325] truncate">
                              {user.email}
                            </p>
                          </div>
                          <Link
                            href="/dashboard"
                            className="block px-4 py-2 text-sm text-[#E6B325] hover:bg-[#E6B325]/10"
                            onClick={() => setIsProfileOpen(false)}
                          >
                            Dashboard
                          </Link>
                          <Link
                            href="/profile"
                            className="block px-4 py-2 text-sm text-[#E6B325] hover:bg-[#E6B325]/10"
                            onClick={() => setIsProfileOpen(false)}
                          >
                            Profile Settings
                          </Link>
                          <Button
                            onClick={handleSignOut}
                            className="w-full flex items-center px-4 py-2 text-sm text-[#E6B325] hover:bg-[#E6B325]/10"
                          >
                            <LogOut size={16} className="mr-2" />
                            Sign Out
                          </Button>
                        </>
                      ) : (
                        <Link
                          href="/login"
                          className="block px-4 py-2 text-sm text-[#E6B325] hover:bg-[#E6B325]/10"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          Sign In
                        </Link>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Cart */}
              <Link
                href="/cart"
                className="p-2 rounded-full text-white hover:bg-brand-blue/20 hover:text-[#E6B325] relative"
              >
                <ShoppingCart size={20} />
                {totalItems > 0 && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center w-4 h-4 text-xs font-bold text-black bg-[#E6B325] rounded-full">
                    {totalItems}
                  </span>
                )}
              </Link>

              {/* Mobile menu toggle */}
              <Button
                className="flex min-[1110px]:hidden p-2 rounded-full text-white hover:bg-brand-blue/20 hover:text-[#E6B325]"
                onClick={toggleMenu}
              >
                {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              className="overflow-hidden min-[1110px]:hidden"
              variants={mobileMenuVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <div className="px-2 pt-2 pb-3 space-y-1 bg-black border-t border-[#E6B325]/10">
                {/* Mobile Search */}
                <form
                  onSubmit={handleSearch}
                  className="flex items-center mb-2 bg-black border border-[#E6B325]/80 rounded-full overflow-hidden"
                >
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search..."
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

                {/* Category groups */}
                {CATEGORY_GROUPS.filter(group => group.name !== "Events").map((group) => {
                  const isTCG = group.name === "TCG";
                  return (
                    <div key={group.name} className="space-y-1">
                      <Button
                        onClick={() => toggleGroup(group.name)}
                        className="w-full flex items-center justify-between px-3 py-2 text-base font-semibold uppercase text-[#E6B325] hover:bg-[#E6B325]/10"
                      >
                        {group.name}
                        <ChevronDown
                          size={20}
                          className={`transition-transform ${
                            expandedGroup === group.name ? "rotate-180" : ""
                          }`}
                        />
                      </Button>
                      <AnimatePresence>
                        {expandedGroup === group.name && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="pl-4"
                          >
                            {(isTCG
                              ? getTopTCGCategories(group.categories)
                              : group.categories
                            ).map((cat) => (
                              <Button
                                key={cat.slug}
                                type="button"
                                className="block w-full text-left px-3 py-2 text-base font-medium text-[#E6B325] hover:bg-[#E6B325]/10"
                                onClick={() => handleCategoryClick(group.name, cat)}
                              >
                                {cat.displayName}
                              </Button>
                            ))}
                            {isTCG && (
                              <Button
                                type="button"
                                className="block w-full text-left px-3 py-2 text-base font-medium text-[#E6B325]/80 hover:text-[#E6B325]"
                                onClick={() => handleCategoryClick(group.name)}
                              >
                                View All TCG
                              </Button>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}

                {/* Events Link (mobile only) */}
                <Link
                  href="/events"
                  className="block px-3 py-2 text-base font-semibold uppercase text-[#E6B325] hover:bg-[#E6B325]/10"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Events
                </Link>

                {/* Admin Link */}
                {navigationItems.map((item) => (
                  <motion.div key={item.href} variants={mobileItemVariants}>
                    <Link
                      href={item.href}
                      className="block px-3 py-2 text-base font-semibold uppercase text-[#E6B325] hover:bg-[#E6B325]/10"
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
