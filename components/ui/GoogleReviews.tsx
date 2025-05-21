"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { useGoogleReviews } from "@hooks/useGoogleReviews";

export default function GoogleReviews() {
  const { reviews, isLoading, error } = useGoogleReviews();

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-gray-900/50 rounded-xl p-6 h-32" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-4">
        <p>Failed to load reviews: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold text-center mb-8 text-brand-gold"
      >
        Customer Reviews
      </motion.h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reviews.map((review, index) => (
          <motion.div
            key={review.time}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800/50 hover:border-brand-blue/30 transition-all duration-300"
          >
            <div className="flex items-center space-x-4 mb-4">
              <div>
                <h3 className="font-semibold text-brand-gold">{review.author_name}</h3>
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < review.rating
                          ? "text-brand-gold fill-brand-gold"
                          : "text-gray-600"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
            <p className="text-gray-300 text-sm">{review.text}</p>
            <p className="text-gray-500 text-xs mt-4">
              {new Date(review.time * 1000).toLocaleDateString()}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
} 