"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  FaInstagram,
  FaFacebook,
  FaYoutube,
  FaTwitter,
  FaTiktok,
  FaPhoneAlt,
  FaMapMarkerAlt,
  FaEnvelope,
} from "react-icons/fa";

const businessInfo = {
  address: "19786 Hwy 105 W ste 190, Montgomery, TX 77356",
  phone: "(936) 449-1277",
  email: "info@mavcollectibles.com",
  hours: [
    { day: "Monday", hours: "Closed (Memorial Day)" },
    { day: "Tuesday", hours: "12–9 PM" },
    { day: "Wednesday", hours: "12–9 PM" },
    { day: "Thursday", hours: "12–9 PM" },
    { day: "Friday", hours: "12–10 PM" },
    { day: "Saturday", hours: "12–10 PM" },
    { day: "Sunday", hours: "12–9 PM" },
  ],
};

const Footer = () => {
  const placeId = process.env.NEXT_PUBLIC_GOOGLE_PLACE_ID;
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  return (
    <footer className="bg-black border-t border-gray-800 pt-10 pb-4 px-4">
      <div className="max-w-7xl mx-auto flex flex-col gap-8 md:gap-0 md:flex-row md:justify-between md:items-start">
        {/* Left: Logo, Slogan, Events */}
        <div className="flex-1 flex flex-col gap-8 md:gap-8 md:pr-6">
          <div className="flex flex-col items-center md:items-start">
            <Link href="/" className="block mb-2">
              <div className="relative w-[200px] h-[70px] md:w-[260px] md:h-[90px] mx-auto md:mx-0">
                <Image
                  src="/mav_collectibles.png"
                  alt="MAV Collectibles Logo"
                  fill
                  sizes="(max-width: 768px) 200px, 260px"
                  className="object-contain"
                  loading="lazy"
                />
              </div>
            </Link>
            <p className="text-xs md:text-sm text-gray-400 text-center md:text-left max-w-xs md:max-w-md">
              Your premier destination for trading card games including Pokémon, Yu-Gi-Oh!, Dragon Ball, One Piece and more.
            </p>
          </div>

          {/* Categories */}
          {CATEGORY_GROUPS.map((group) => (
            <div key={group.name} className="col-span-1">
              <h3 className="text-[#E6B325] font-semibold text-lg mb-4">
                {group.name}
              </h3>
              <ul className="space-y-2">
                {group.categories.slice(0, 6).map((category) => (
                  <li key={category.slug}>
                    <Link
                      href={`/category/${category.slug}`}
                      className="text-gray-400 hover:text-[#E6B325] transition-colors"
                    >
                      {category.displayName}
                    </Link>
                  </li>
                ))}
                {group.categories.length > 6 && (
                  <li>
                    <Link
                      href={`/category/${group.name.toLowerCase().replace(/\s+/g, "-")}`}
                      className="text-[#E6B325] hover:underline transition-colors"
                    >
                      View All {group.name}
                    </Link>
                  </li>
                )}
              </ul>
            </div>
          ))}

          {/* Quick Links */}
          <div className="col-span-1">
            <h3 className="text-[#E6B325] font-semibold text-lg mb-4">
              Information
            </h3>
            <ul className="space-y-2">
              <li>
                <Link href="/events" className="text-gray-300 hover:text-[#E6B325] transition-colors">Wheel Spin</Link>
              </li>
              {/* Add more events as needed */}
            </ul>
          </div>
        </div>

        {/* Center: Information */}
        <div className="flex-1 flex flex-col items-center md:items-center justify-center mt-6 md:mt-0">
          <div className="w-full max-w-md md:bg-gray-900/70 md:rounded-lg md:p-6 md:shadow-sm">
            <h3 className="text-[#E6B325] font-bold text-base mb-3 uppercase tracking-wide text-center">Information</h3>
            <div className="flex flex-col gap-2 items-center md:items-start">
              <div className="flex items-center mb-1">
                <FaMapMarkerAlt className="text-[#E6B325] mr-2" />
                <span className="text-gray-300 text-xs md:text-sm text-center md:text-left">{businessInfo.address}</span>
              </div>
              <div className="flex items-center mb-1">
                <FaPhoneAlt className="text-[#E6B325] mr-2" />
                <a href={`tel:${businessInfo.phone.replace(/[^\d]/g, "")}`} className="text-gray-300 text-xs md:text-sm hover:text-[#E6B325] transition-colors text-center md:text-left">{businessInfo.phone}</a>
              </div>
              <div className="flex items-center mb-1">
                <FaEnvelope className="text-[#E6B325] mr-2" />
                <a href={`mailto:${businessInfo.email}`} className="text-gray-300 text-xs md:text-sm hover:text-[#E6B325] transition-colors text-center md:text-left">{businessInfo.email}</a>
              </div>
              <div className="mt-2 w-full">
                <h4 className="text-[#E6B325] font-semibold text-xs mb-1 text-center md:text-left">Hours</h4>
                <ul className="text-gray-300 text-xs w-full">
                  {businessInfo.hours.map((h) => (
                    <li key={h.day} className="flex justify-between w-full max-w-xs mx-auto md:mx-0">
                      <span>{h.day}</span>
                      <span>{h.hours}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Contact & Map */}
        <div className="flex-1 flex flex-col items-center md:items-center gap-4 md:pl-6 mt-6 md:mt-0">
          <div className="w-full max-w-xs md:bg-gray-900/70 md:rounded-lg md:p-4 md:shadow-sm flex flex-col items-center md:items-center">
            <h3 className="text-[#E6B325] font-bold text-base mb-2 uppercase tracking-wide text-center">Contact</h3>
            <div className="flex space-x-2 mb-2 justify-center w-full">
              <a href="https://www.instagram.com/mavdamadcollector" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-gray-400 hover:text-[#E6B325] transition-colors"><FaInstagram size={22} /></a>
              <a href="https://www.facebook.com/MavCollectibles" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="text-gray-400 hover:text-[#E6B325] transition-colors"><FaFacebook size={22} /></a>
              <a href="https://www.youtube.com/MaVDaMaDCoLLeCToR" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="text-gray-400 hover:text-[#E6B325] transition-colors"><FaYoutube size={22} /></a>
              <a href="https://www.tiktok.com/@mav_collectibles" target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="text-gray-400 hover:text-[#E6B325] transition-colors"><FaTiktok size={20} /></a>
              <a href="https://x.com/MavCollectibles" target="_blank" rel="noopener noreferrer" aria-label="Twitter/X" className="text-gray-400 hover:text-[#E6B325] transition-colors"><FaTwitter size={22} /></a>
            </div>
            <Link href="/contact" className="inline-block w-full md:w-auto px-3 py-2 border border-[#E6B325] text-[#E6B325] hover:bg-[#E6B325] hover:text-black transition-colors rounded-md text-center font-semibold mb-2 text-xs md:text-sm">Contact Us</Link>
            <div className="w-full h-40 md:w-60 md:h-32 rounded-lg overflow-hidden border border-gray-800 mx-auto md:mx-0 mt-2">
              <iframe
                src={`https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=place_id:${placeId}&zoom=15`}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="MAV Collectibles Location"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1 text-center">Visit our store</p>
          </div>
        </div>
      </div>
      <div className="mt-8 pt-4 border-t border-gray-800 text-center text-xs text-gray-400">
        <p>
          © {new Date().getFullYear()} MAV Collectibles. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
