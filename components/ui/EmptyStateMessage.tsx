import { motion } from "framer-motion";
import Image from "next/image";

interface EmptyStateMessageProps {
  title?: string;
  buttonText?: string;
  onButtonClick?: () => void;
}

export function EmptyStateMessage({ 
  title = "No products found", 
  buttonText = "Try another category",
  onButtonClick = () => window.scrollTo({ top: 0, behavior: 'smooth' })
}: EmptyStateMessageProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-4">
      <div className="relative w-32 h-32 mb-2 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-black" />
        <Image
          src="/images/karp.gif"
          alt="Magikarp splashing"
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
        {title}
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        className="text-base text-gray-400"
      >
        <button
          onClick={onButtonClick}
          className="text-[#E6B325] underline hover:text-[#FFD966] transition-colors font-semibold focus:outline-none"
        >
          {buttonText}
        </button>
      </motion.div>
    </div>
  );
} 