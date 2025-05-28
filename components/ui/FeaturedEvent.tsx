import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from "@components/ui/button";

export interface FeaturedEventProps {
  title: string;
  date: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  link?: string;
}

const FeaturedEvent: React.FC<FeaturedEventProps> = ({
  title,
  date,
  description,
  imageSrc,
  imageAlt,
  link
}) => {
  return (
    <div className="w-full bg-gradient-to-b from-black to-gray-900 rounded-lg overflow-hidden shadow border border-brand-blue/20 hover:border-brand-blue/40 transition-all duration-150 hover:shadow-md hover:shadow-brand-blue/10 h-full min-h-[120px] flex flex-col md:flex-row gap-2 p-2 md:p-3">
      {/* Image Section */}
      <div className="flex-shrink-0 flex items-center justify-center w-full md:w-auto">
        <div className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-md overflow-hidden">
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            className="object-contain"
            priority
            sizes="(max-width: 640px) 64px, (max-width: 768px) 80px, 96px"
          />
        </div>
      </div>
      {/* Content Section */}
      <div className="flex-1 flex flex-col justify-center items-start text-left gap-1 min-w-0">
        <h2 className="text-base md:text-lg font-bold text-[#E6B325] hover:text-[#FFD966] transition-colors leading-tight truncate w-full">{title}</h2>
        <p className="text-gray-400 text-xs md:text-sm font-medium truncate w-full">{date}</p>
        <div className="prose prose-invert max-w-none text-xs md:text-sm mb-1 w-full">
          <p className="line-clamp-2 md:line-clamp-3 break-words">{description}</p>
        </div>
        {link && (
          <Button variant="gold" size="sm" asChild className="mt-1">
            <Link href={link}>
              Learn More
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
};

export default FeaturedEvent; 