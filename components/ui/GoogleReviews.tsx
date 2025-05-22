"use client";

import { motion } from "framer-motion";
import { Star, StarHalf } from "lucide-react";
import { useGoogleReviews } from "@hooks/useGoogleReviews";

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

  // If error, render nothing
  if (error) return null;

  // Sort by time descending and take top 3
  const latestReviews = [...reviews]
    .sort((a, b) => b.time - a.time)
    .slice(0, 3);

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-gray-900/80 rounded-xl p-6 h-32 shadow-lg"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="w-full px-4 md:px-8">
      <div className="space-y-6">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold text-center mb-8 text-[#E6B325]"
        >
          Customer Reviews
        </motion.h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {latestReviews.map((review, index) => (
            <motion.div
              key={review.time}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gray-900/80 shadow-lg rounded-xl p-6 border border-gray-800/70 hover:border-[#E6B325]/60 hover:shadow-2xl transition-all duration-300 hover:scale-[1.03] cursor-pointer"
              whileHover={{ y: -6, scale: 1.04 }}
            >
              <div className="flex items-center space-x-4 mb-4">
                <div>
                  <h3 className="font-semibold text-white mb-1">
                    {review.author_name}
                  </h3>
                  <div className="flex items-center">
                    {renderStars(review.rating)}
                  </div>
                </div>
              </div>
              <p className="text-gray-200 text-base mb-2">{review.text}</p>
              <p className="text-gray-400 text-xs mt-4">
                {new Date(review.time * 1000).toLocaleDateString()}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
