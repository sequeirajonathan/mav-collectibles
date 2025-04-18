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
          className="fixed bottom-6 right-6 p-3 rounded-full bg-[#E6B325] text-black shadow-lg hover:bg-[#FFD966] transition-colors z-50"
          aria-label="Scroll to top"
        >
          <ChevronUp size={24} />
        </button>
      )}
    </>
  );
} 