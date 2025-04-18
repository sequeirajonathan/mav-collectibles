"use client";

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Carousel, { CarouselItem } from './Carousel';
import { Button } from './button';

interface Announcement {
  id: string;
  title: string;
  description: string;
  buttonText?: string;
  buttonLink?: string;
  bgColor?: string;
}

interface AnnouncementCarouselProps {
  announcements: Announcement[];
  className?: string;
}

const AnnouncementCarousel: React.FC<AnnouncementCarouselProps> = ({
  announcements,
  className = '',
}) => {
  const carouselItems: CarouselItem[] = announcements.map((announcement) => ({
    id: announcement.id,
    content: (
      <div 
        className={`flex flex-col items-center justify-center text-center p-6 pb-12 h-full ${announcement.bgColor || 'bg-gray-900'}`}
      >
        <motion.div
          initial={{ opacity: 1, y: 0 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h3 className="text-xl md:text-2xl font-bold text-[#E6B325] mb-2">{announcement.title}</h3>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 1, y: 0 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <p className="text-white mb-4 max-w-2xl">{announcement.description}</p>
        </motion.div>
        
        {announcement.buttonText && announcement.buttonLink && (
          <motion.div
            initial={{ opacity: 1, scale: 1 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button variant="gold" size="default" asChild>
              <Link href={announcement.buttonLink}>
                {announcement.buttonText}
              </Link>
            </Button>
          </motion.div>
        )}
      </div>
    ),
  }));

  return (
    <Carousel 
      items={carouselItems} 
      className={`h-48 md:h-56 ${className}`}
      autoPlayInterval={7000}
    />
  );
};

export default AnnouncementCarousel; 