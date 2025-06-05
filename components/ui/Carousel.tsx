"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './button';

export interface CarouselItem {
  id: string;
  content: React.ReactNode;
}

interface CarouselProps {
  items: CarouselItem[];
  autoPlayInterval?: number; // in milliseconds
  className?: string;
  itemsPerSlide?: number; // NEW: number of items to show per slide
}

const Carousel: React.FC<CarouselProps> = ({
  items,
  autoPlayInterval = 5000,
  className = '',
  itemsPerSlide = 1, // NEW: default to 1
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [direction, setDirection] = useState(0); // -1 for left, 1 for right

  // Calculate total slides
  const totalSlides = Math.ceil(items.length / itemsPerSlide);

  const nextSlide = useCallback(() => {
    setDirection(1);
    setActiveIndex((current) => (current === totalSlides - 1 ? 0 : current + 1));
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    setDirection(-1);
    setActiveIndex((current) => (current === 0 ? totalSlides - 1 : current - 1));
  }, [totalSlides]);

  const goToSlide = (index: number) => {
    setDirection(index > activeIndex ? 1 : -1);
    setActiveIndex(index);
  };

  // Auto-play functionality
  useEffect(() => {
    if (isPaused || totalSlides <= 1) return;
    const interval = setInterval(() => {
      nextSlide();
    }, autoPlayInterval);
    return () => clearInterval(interval);
  }, [nextSlide, autoPlayInterval, isPaused, totalSlides]);

  if (items.length === 0) return null;

  // Variants for page animations
  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  };

  // Transition settings
  const transition = {
    x: { type: "spring", stiffness: 300, damping: 30 },
    opacity: { duration: 0.2 },
  };

  // Get items for current slide
  const start = activeIndex * itemsPerSlide;
  const end = start + itemsPerSlide;
  const slideItems = items.slice(start, end);

  return (
    <div 
      className={`relative w-full overflow-hidden rounded-lg ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Carousel items with AnimatePresence for exit animations */}
      <div className="relative h-full">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={activeIndex}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={transition}
            className="absolute inset-0 w-full h-full flex items-center justify-center gap-4"
          >
            {slideItems.map((item) => (
              <div key={item.id} className="flex-1 h-full flex items-center justify-center">
                {item.content}
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation arrows with motion effects */}
      {totalSlides > 1 && (
        <>
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="absolute left-2 top-1/2 z-20 -translate-y-1/2"
          >
            <Button
              variant="ghost"
              size="icon"
              className="bg-black/30 hover:bg-black/50 rounded-full text-white"
              onClick={prevSlide}
              aria-label="Previous slide"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="absolute right-2 top-1/2 z-20 -translate-y-1/2"
          >
            <Button
              variant="ghost"
              size="icon"
              className="bg-black/30 hover:bg-black/50 rounded-full text-white"
              onClick={nextSlide}
              aria-label="Next slide"
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </motion.div>
        </>
      )}

      {/* Indicators with motion effects */}
      {totalSlides > 1 && (
        <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 space-x-2">
          {Array.from({ length: totalSlides }).map((_, index) => (
            <motion.button
              key={index}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              className={`h-2 rounded-full transition-all ${
                index === activeIndex ? 'bg-[#E6B325] w-4' : 'bg-white/50 hover:bg-white/80 w-2'
              }`}
              onClick={() => goToSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Carousel; 