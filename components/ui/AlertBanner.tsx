"use client";

import { X } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';
import { motion, AnimatePresence } from 'framer-motion';

const AlertBanner = () => {
  const { 
    featureFlags, 
    alertBanner, 
    dismissAlertBanner, 
    alertBannerDismissed 
  } = useAppContext();
  
  // Check if the showAlertBanner feature flag is enabled
  const showAlertBanner = featureFlags['showAlertBanner'];
  
  if (!showAlertBanner || !alertBanner || alertBannerDismissed) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        style={{ 
          backgroundColor: alertBanner.backgroundColor, 
          color: alertBanner.textColor 
        }}
        className="relative text-center py-2 px-4 font-medium"
      >
        {alertBanner.message} {alertBanner.code && <span className="font-bold">Use code: {alertBanner.code}</span>}
        <button 
          onClick={dismissAlertBanner}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-black/10"
          aria-label="Dismiss alert"
        >
          <X size={16} />
        </button>
      </motion.div>
    </AnimatePresence>
  );
};

export default AlertBanner; 