"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { LoginForm } from './LoginForm';
import { Button } from '@components/ui/button';
import { useUser } from '@clerk/nextjs';
import { useEffect } from 'react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const { user } = useUser();

  // Close modal when user is authenticated
  useEffect(() => {
    if (user && isOpen) {
      if (process.env.NEXT_PUBLIC_DEBUG === 'true') {
        console.log('🔐 LoginModal - User authenticated:', user.primaryEmailAddress?.emailAddress);
      }
      onClose();
    }
  }, [user, isOpen, onClose]);

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
            className="fixed inset-0 bg-black/80 z-[100]"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-[calc(100%-2rem)] max-w-md md:max-w-lg lg:max-w-xl"
            style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
          >
            <div className="relative bg-black border border-[#E6B325]/30 rounded-lg shadow-lg p-3 md:p-6">
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="absolute -right-2 -top-2 p-1.5 md:p-2 rounded-full bg-black border border-[#E6B325]/30 text-[#E6B325] hover:bg-[#E6B325]/10 transition-colors touch-manipulation"
                style={{ touchAction: 'manipulation' }}
                aria-label="Close login modal"
              >
                <X size={18} className="w-4 h-4 md:w-5 md:h-5" />
              </Button>
              <div className="mt-1 md:mt-0">
                <LoginForm redirectTo="/admin" hideSignupLink={true} />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
} 