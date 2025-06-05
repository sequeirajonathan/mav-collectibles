"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Star, StarHalf, X } from "lucide-react";
import { useGoogleReviews } from "@hooks/useGoogleReviews";
import { useState, useEffect } from "react";
import Carousel, { CarouselItem } from "./Carousel";
import { Button } from "./button";

const REVIEW_CHAR_LIMIT = 150; // Reduced from 250 for better mobile display

function renderStars(rating: number) {
  // Google returns float, e.g. 4.7, 3.5
  const stars = [];
  const rounded = Math.round(rating * 2) / 2;

  for (let i = 1; i <= 5; i++) {
    let icon;
    if (i <= rounded) {
      icon = <Star className="w-5 h-5 text-[#E6B325] fill-[#E6B325]" />;
    } else if (i - 0.5 === rounded) {
      icon = <StarHalf className="w-5 h-5 text-[#E6B325] fill-[#E6B325]" />;
    } else {
      icon = <Star className="w-5 h-5 text-[#E6B325] fill-none" />;
    }
    stars.push(
      <motion.span
        key={i}
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 * i, type: "spring", stiffness: 300 }}
        className="inline-block"
      >
        {icon}
      </motion.span>
    );
  }
  return stars;
}

export default function GoogleReviews() {
  const { reviews, isLoading, error } = useGoogleReviews();
  const [modalReview, setModalReview] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemsPerSlide, setItemsPerSlide] = useState(1);
  const [isMobile, setIsMobile] = useState(false);

  // Responsive itemsPerSlide and mobile detection
  useEffect(() => {
    function handleResize() {
      const width = window.innerWidth;
      setItemsPerSlide(width >= 1024 ? 3 : 1);
      setIsMobile(width < 640); // Tailwind's sm breakpoint
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Prepare carousel items for all reviews
  const carouselItems: CarouselItem[] = [...reviews]
    .sort((a, b) => b.time - a.time)
    .map((review) => {
      const isLong = review.text.length > REVIEW_CHAR_LIMIT;
      const displayText = isLong
        ? review.text.slice(0, REVIEW_CHAR_LIMIT) + "..."
        : review.text;
      return {
        id: String(review.time),
        content: (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#181f2a] shadow-lg rounded-xl p-4 sm:p-6 border border-gray-800/70 hover:border-[#E6B325]/60 hover:shadow-2xl transition-all duration-300 hover:scale-[1.03] cursor-pointer w-full h-full"
            onClick={() => {
              setModalReview(review);
              setIsModalOpen(true);
            }}
            title={isLong ? 'Click to read full review' : undefined}
          >
            <div className="h-full flex flex-col">
              {/* Header section - fixed height */}
              <div className="mb-3 sm:mb-4">
                <h3 className="font-semibold text-white text-sm sm:text-base truncate mb-1">
                  {review.author_name}
                </h3>
                <div className="flex items-center">
                  {renderStars(review.rating)}
                </div>
              </div>
              
              {/* Review text - flexible middle section */}
              <div className="flex-1 min-h-0 mb-3">
                <p className="text-gray-200 text-sm sm:text-base leading-relaxed line-clamp-3 sm:line-clamp-4">
                  {displayText}
                </p>
                {isLong && (
                  <span className="text-[#E6B325] text-xs mt-1 inline-block">
                    Tap to read more
                  </span>
                )}
              </div>
              
              {/* Date - always at bottom */}
              <div className="pt-2 border-t border-gray-700/50 mt-auto">
                <p className="text-gray-400 text-xs">
                  {new Date(review.time * 1000).toLocaleDateString()}
                </p>
              </div>
            </div>
          </motion.div>
        ),
      };
    });

  if (isLoading) {
    return (
      <div className="w-full px-4 md:px-8">
        <div className="space-y-6">
          <div className="animate-pulse h-8 w-48 bg-gray-800 rounded mx-auto mb-8" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-gray-900/80 rounded-xl p-6 h-32 shadow-lg animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || carouselItems.length === 0) {
    return null;
  }

  return (
    <div className="w-full px-4 md:px-8">
      <div className="space-y-6">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-8 text-[#E6B325]"
        >
          Customer Reviews
        </motion.h2>
        <Carousel
          items={carouselItems}
          className="h-[280px] sm:h-[300px]"
          autoPlayInterval={7000}
          itemsPerSlide={itemsPerSlide}
        />
        <ReviewModal
          review={modalReview}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      </div>
    </div>
  );
}
