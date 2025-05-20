"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { LoginForm } from './LoginForm';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
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
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm md:max-w-md px-4 md:px-0"
          >
            <div className="relative bg-black rounded-lg shadow-lg p-4 md:p-6">
              <button
                onClick={onClose}
                className="absolute -right-2 -top-2 p-2 rounded-full bg-black border border-[#E6B325]/30 text-[#E6B325] hover:bg-[#E6B325]/10 transition-colors"
                style={{ touchAction: 'manipulation' }}
                aria-label="Close login modal"
              >
                <X size={20} />
              </button>
              <LoginForm redirectTo="/admin" />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
} 