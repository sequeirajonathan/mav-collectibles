import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FaInstagram, FaFacebook, FaYoutube, FaTwitter, FaTiktok } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="bg-black border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and About */}
          <div className="col-span-1 md:col-span-1">
            <Link href="/" className="flex items-center">
              <Image
                src="/mav_collectibles.png"
                alt="MAV Collectibles Logo"
                width={150}
                height={60}
                className="h-auto"
              />
            </Link>
            <p className="mt-4 text-sm text-gray-400">
              Your premier destination for trading card games including Pokémon, Yu-Gi-Oh!, Dragon Ball, One Piece and more.
            </p>
          </div>

          {/* Quick Links */}
          <div className="col-span-1">
            <h3 className="text-[#E6B325] font-semibold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-400 hover:text-[#E6B325] transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/all-cards" className="text-gray-400 hover:text-[#E6B325] transition-colors">
                  All Cards
                </Link>
              </li>
              <li>
                <Link href="/events" className="text-gray-400 hover:text-[#E6B325] transition-colors">
                  Events
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-gray-400 hover:text-[#E6B325] transition-colors">
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div className="col-span-1">
            <h3 className="text-[#E6B325] font-semibold text-lg mb-4">Categories</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/pokemon" className="text-gray-400 hover:text-[#E6B325] transition-colors">
                  Pokémon
                </Link>
              </li>
              <li>
                <Link href="/yu-gi-oh" className="text-gray-400 hover:text-[#E6B325] transition-colors">
                  Yu-Gi-Oh!
                </Link>
              </li>
              <li>
                <Link href="/one-piece" className="text-gray-400 hover:text-[#E6B325] transition-colors">
                  One Piece
                </Link>
              </li>
              <li>
                <Link href="/dragon-ball" className="text-gray-400 hover:text-[#E6B325] transition-colors">
                  Dragon Ball
                </Link>
              </li>
            </ul>
          </div>

          {/* Social Media and Contact */}
          <div className="col-span-1">
            <h3 className="text-[#E6B325] font-semibold text-lg mb-4">Connect With Us</h3>
            <div className="flex space-x-4 mb-4">
              <a 
                href="https://www.instagram.com/mavdamadcollector" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-[#E6B325] transition-colors"
                aria-label="Instagram"
              >
                <FaInstagram size={24} />
              </a>
              <a 
                href="https://www.facebook.com/MavCollectibles" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-[#E6B325] transition-colors"
                aria-label="Facebook"
              >
                <FaFacebook size={24} />
              </a>
              <a 
                href="https://www.youtube.com/MaVDaMaDCoLLeCToR" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-[#E6B325] transition-colors"
                aria-label="YouTube"
              >
                <FaYoutube size={24} />
              </a>
              <a 
                href="https://www.tiktok.com/@mav_collectibles" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-[#E6B325] transition-colors"
                aria-label="TikTok"
              >
                <FaTiktok size={22} />
              </a>
              <a 
                href="https://x.com/MavCollectibles" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-[#E6B325] transition-colors"
                aria-label="Twitter/X"
              >
                <FaTwitter size={24} />
              </a>
            </div>
            <p className="text-sm text-gray-400">
              Contact us: <a href="mailto:info@mavcollectibles.com" className="text-[#E6B325] hover:underline">info@mavcollectibles.com</a>
            </p>
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