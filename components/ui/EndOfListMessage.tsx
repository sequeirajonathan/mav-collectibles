import { motion } from "framer-motion";
import Image from "next/image";

export function EndOfListMessage() {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-4">
      <div className="relative w-32 h-32 mb-2 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-black" />
        <Image
          src="/images/gengar.gif"
          alt="Gengar waving"
          width={128}
          height={128}
          className="w-32 h-32 relative"
          priority
          unoptimized
        />
      </div>
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="text-2xl font-bold text-[#E6B325] mb-2"
      >
        No more cards in this pack!
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        className="text-base text-gray-400"
      >
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="text-[#E6B325] underline hover:text-[#FFD966] transition-colors font-semibold focus:outline-none"
        >
          Search another category!
        </button>
      </motion.div>
    </div>
  );
} 