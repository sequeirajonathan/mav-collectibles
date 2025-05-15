import { motion } from "framer-motion";
import React, { useState, useEffect } from 'react';

export function SkeletonProductCard() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return (
    <motion.div
      className="bg-gray-800 rounded-lg overflow-hidden h-[260px] md:h-[420px] flex flex-col"
      initial={false}
      animate={mounted ? { opacity: 1 } : false}
      transition={{ duration: 0.5 }}
    >
      <div className="relative aspect-[4/5] h-[120px] md:aspect-[4/3] md:h-[220px] bg-gray-700 animate-pulse" />
      <div className="p-4 flex flex-col flex-1 justify-between">
        <div className="space-y-2">
          <div className="h-4 bg-gray-700 rounded w-3/4 animate-pulse" />
          <div className="h-4 bg-gray-700 rounded w-1/2 animate-pulse" />
        </div>
        <div className="mt-4 h-6 bg-gray-700 rounded w-1/3 animate-pulse" />
      </div>
    </motion.div>
  );
}
