"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FaInstagram, FaFacebook, FaYoutube, FaTwitter, FaTiktok } from 'react-icons/fa';
import { useSupabase } from "@contexts/SupabaseContext";

const Footer = () => {
  const { userProfile } = useSupabase();
  const hasAdminAccess = userProfile?.role && ['STAFF', 'MANAGER', 'ADMIN', 'OWNER'].includes(userProfile.role);

  return (
    <footer className="bg-black border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About Section */}
          <div className="col-span-1">
            <Link href="/" className="block mb-4">
              <Image
                src="/mav_collectibles.png"
                alt="MAV Collectibles Logo"
                width={120}
                height={48}
                className="h-auto"
              />
            </Link>
            <p className="text-sm text-gray-400 mb-4">
              Your premier destination for trading card games including Pokémon, Yu-Gi-Oh!, Dragon Ball, One Piece and more.
            </p>
            <div className="flex space-x-4">
              <a 
                href="https://www.instagram.com/mavdamadcollector" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-[#E6B325] transition-colors"
                aria-label="Instagram"
              >
                <FaInstagram size={20} />
              </a>
              <a 
                href="https://www.facebook.com/MavCollectibles" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-[#E6B325] transition-colors"
                aria-label="Facebook"
              >
                <FaFacebook size={20} />
              </a>
              <a 
                href="https://www.youtube.com/MaVDaMaDCoLLeCToR" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-[#E6B325] transition-colors"
                aria-label="YouTube"
              >
                <FaYoutube size={20} />
              </a>
              <a 
                href="https://www.tiktok.com/@mav_collectibles" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-[#E6B325] transition-colors"
                aria-label="TikTok"
              >
                <FaTiktok size={18} />
              </a>
              <a 
                href="https://x.com/MavCollectibles" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-[#E6B325] transition-colors"
                aria-label="Twitter/X"
              >
                <FaTwitter size={20} />
              </a>
            </div>
          </div>

          {/* Categories */}
          <div className="col-span-1">
            <h3 className="text-[#E6B325] font-semibold text-lg mb-4">Shop</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/products/pokemon" className="text-gray-400 hover:text-[#E6B325] transition-colors">
                  Pokémon
                </Link>
              </li>
              <li>
                <Link href="/products/yugioh" className="text-gray-400 hover:text-[#E6B325] transition-colors">
                  Yu-Gi-Oh!
                </Link>
              </li>
              <li>
                <Link href="/products/onepiece" className="text-gray-400 hover:text-[#E6B325] transition-colors">
                  One Piece
                </Link>
              </li>
              <li>
                <Link href="/products/dragonball" className="text-gray-400 hover:text-[#E6B325] transition-colors">
                  Dragon Ball
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div className="col-span-1">
            <h3 className="text-[#E6B325] font-semibold text-lg mb-4">Information</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-gray-400 hover:text-[#E6B325] transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/events" className="text-gray-400 hover:text-[#E6B325] transition-colors">
                  Events
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="text-gray-400 hover:text-[#E6B325] transition-colors">
                  Shipping Info
                </Link>
              </li>
              <li>
                <Link href="/returns" className="text-gray-400 hover:text-[#E6B325] transition-colors">
                  Returns Policy
                </Link>
              </li>
              {hasAdminAccess && (
                <li>
                  <Link href="/admin" className="text-gray-400 hover:text-[#E6B325] transition-colors">
                    Admin Dashboard
                  </Link>
                </li>
              )}
            </ul>
          </div>

          {/* Contact */}
          <div className="col-span-1">
            <h3 className="text-[#E6B325] font-semibold text-lg mb-4">Contact</h3>
            <div className="space-y-2">
              <p className="text-sm text-gray-400">
                Questions? Get in touch:
              </p>
              <a 
                href="mailto:info@mavcollectibles.com" 
                className="text-[#E6B325] hover:underline block"
              >
                info@mavcollectibles.com
              </a>
              <div className="mt-4">
                <Link 
                  href="/contact" 
                  className="inline-block px-4 py-2 border border-[#E6B325] text-[#E6B325] hover:bg-[#E6B325] hover:text-black transition-colors rounded-md"
                >
                  Contact Us
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-800 text-center text-sm text-gray-400">
          <p>© {new Date().getFullYear()} MAV Collectibles. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 