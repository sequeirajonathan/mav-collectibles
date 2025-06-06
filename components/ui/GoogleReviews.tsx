"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Star, StarHalf, X } from "lucide-react";
import { useGoogleReviews } from "@hooks/useGoogleReviews";
import { useState, useEffect } from "react";
import Carousel, { CarouselItem } from "./Carousel";
import { Button } from "./button";
import Image from "next/image";

interface GoogleReview {
  author_name: string;
  profile_photo_url?: string;
  rating: number;
  text: string;
  time: number;
  response?: {
    text: string;
  } | string;
}

const REVIEW_CHAR_LIMIT = 150;

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

// Helper to get initials from a name
function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// Add a helper React component for the profile image with fallback and retry logic
function ProfileImage({ src, alt, size = 40, initials }: { src?: string; alt: string; size?: number; initials: string }) {
  const [errorCount, setErrorCount] = useState(0);

  if (!src || errorCount >= 2) {
    return (
      <div
        className={`rounded-full bg-[#232b3a] text-white flex items-center justify-center font-bold select-none`}
        style={{ width: size, height: size, fontSize: size * 0.45 }}
      >
        {initials}
      </div>
    );
  }

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <Image
        src={src}
        alt={alt}
        fill
        className="rounded-full object-cover border border-gray-700 bg-[#232b3a] text-white"
        sizes={`${size}px`}
        loading="lazy"
        onError={() => {
          if (errorCount < 1) {
            // Retry loading once
            setErrorCount((c) => c + 1);
          } else {
            setErrorCount((c) => c + 1);
          }
        }}
      />
    </div>
  );
}

function ReviewModal({ review, isOpen, onClose }: { review: GoogleReview | null; isOpen: boolean; onClose: () => void }) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!review) return null;
  // Extract owner's response if present
  let ownerResponse = '';
  if (review.response) {
    if (typeof review.response === 'string') {
      ownerResponse = review.response;
    } else if (typeof review.response === 'object' && review.response.text) {
      ownerResponse = review.response.text;
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 z-50"
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
          />
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg px-4"
            style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
          >
            <div className="relative bg-[#181f2a] border border-[#E6B325]/30 rounded-lg shadow-lg p-6 max-h-[80vh] overflow-y-auto overflow-x-hidden custom-scrollbar">
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="absolute top-2 right-2 rounded-full bg-black border border-[#E6B325]/30 text-[#E6B325] hover:bg-[#E6B325]/10 transition-colors"
                aria-label="Close review modal"
              >
                <X size={20} />
              </Button>
              <div className="flex items-center gap-3 mb-2">
                <ProfileImage
                  src={review.profile_photo_url}
                  alt={review.author_name + " profile"}
                  size={40}
                  initials={getInitials(review.author_name)}
                />
                <div>
                  <h3 className="font-semibold text-white mb-1">{review.author_name}</h3>
                  <div className="flex items-center">{renderStars(review.rating)}</div>
                </div>
              </div>
              <p className="text-gray-200 text-base whitespace-pre-line break-words">{review.text}</p>
              <p className="text-gray-400 text-xs mt-4">{new Date(review.time * 1000).toLocaleDateString()}</p>
              <div className="mt-6 pt-4 border-t border-gray-700/50">
                <h4 className="font-semibold text-[#E6B325] text-sm mb-1">Owner&apos;s Response</h4>
                <p className="text-gray-300 text-sm whitespace-pre-line">
                  {ownerResponse ? ownerResponse : 'No response from owner.'}
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default function GoogleReviews() {
  const { reviews, isLoading, error } = useGoogleReviews();
  const [modalReview, setModalReview] = useState<GoogleReview | null>(null);
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

  if (error || reviews.length === 0) {
    return null;
  }

  // Prepare carousel items for all reviews
  const carouselItems: CarouselItem[] = [...reviews]
    .sort((a, b) => b.time - a.time)
    .map((review) => {
      // Adjust character limit for mobile
      const charLimit = isMobile ? 100 : REVIEW_CHAR_LIMIT;
      const isLong = review.text.length > charLimit;
      const displayText = isLong
        ? review.text.slice(0, charLimit) + "..."
        : review.text;
      return {
        id: String(review.time),
        content: (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#181f2a] shadow-lg rounded-xl p-4 sm:p-6 border border-gray-800/70 cursor-pointer w-full h-full"
            onClick={() => {
              setModalReview(review);
              setIsModalOpen(true);
            }}
            title={isLong ? 'Click to read full review' : undefined}
          >
            <div className="h-full flex flex-col">
              {/* Header section - fixed height */}
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <ProfileImage
                  src={review.profile_photo_url}
                  alt={review.author_name + " profile"}
                  size={32}
                  initials={getInitials(review.author_name)}
                />
                <div className="min-w-0">
                  <h3 className="font-semibold text-white text-sm sm:text-base truncate mb-1">
                    {review.author_name}
                  </h3>
                  <div className="flex items-center">
                    {renderStars(review.rating)}
                  </div>
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
          key={itemsPerSlide}
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
