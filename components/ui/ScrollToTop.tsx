"use client";

import { useState, useEffect } from 'react';
import { ChevronUp } from 'lucide-react';

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 500) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <>
      {isVisible && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-20 right-4 p-2 rounded-full bg-[#E6B325] text-black shadow-lg hover:bg-[#FFD966] transition-colors z-50 md:bottom-8 md:right-6 md:p-3"
          aria-label="Scroll to top"
        >
          <ChevronUp size={20} className="md:w-6 md:h-6 w-5 h-5" />
        </button>
      )}
    </>
  );
} 