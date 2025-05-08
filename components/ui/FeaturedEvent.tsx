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
  bulletPoints?: string[];
  link?: string;
}

const FeaturedEvent: React.FC<FeaturedEventProps> = ({
  title,
  date,
  description,
  imageSrc,
  imageAlt,
  bulletPoints = [],
  link
}) => {
  return (
    <div className="w-full bg-gradient-to-b from-black to-gray-900 rounded-lg overflow-hidden shadow-xl border border-brand-blue/20 hover:border-brand-blue/40 transition-all duration-300 hover:shadow-2xl hover:shadow-brand-blue/10">
      <div className="flex flex-col md:flex-row h-full">
        {/* Image Section */}
        <div className="md:w-2/5 relative h-48 sm:h-56 md:h-auto overflow-hidden group">
          <div className="relative w-full h-full">
            <Image 
              src={imageSrc} 
              alt={imageAlt}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              priority
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
            />
          </div>
        </div>
        
        {/* Content Section */}
        <div className="flex-1 p-4 md:p-6 flex flex-col">
          <h2 className="text-xl md:text-2xl font-bold mb-2 text-brand-gold hover:text-brand-gold-light transition-colors">{title}</h2>
          <p className="text-gray-300 mb-3 text-sm md:text-base">{date}</p>
          
          <div className="prose prose-invert mb-4 max-w-none text-sm md:text-base">
            <p className="line-clamp-3 md:line-clamp-none">{description}</p>
          </div>
          
          {bulletPoints.length > 0 && (
            <ul className="list-disc list-inside space-y-1 mb-4 text-sm md:text-base">
              {bulletPoints.map((point, index) => (
                <li key={index} className="text-gray-200">
                  <span className="text-brand-blue-light">{point.split(':')[0]}</span>
                  {point.includes(':') ? `: ${point.split(':').slice(1).join(':')}` : point}
                </li>
              ))}
            </ul>
          )}
          
          {link && (
            <Button variant="gold" size="lg" asChild className="mt-auto">
              <Link href={link}>
                Learn More
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeaturedEvent; 