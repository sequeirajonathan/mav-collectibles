import { motion } from "framer-motion";

export function SkeletonProductCard() {
  return (
    <motion.div
      className="bg-gray-800 rounded-lg overflow-hidden h-[420px] flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="relative aspect-[4/3] bg-gray-700 animate-pulse" />
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
