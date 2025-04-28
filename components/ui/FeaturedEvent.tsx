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
    <div className="w-full bg-gradient-to-b from-black to-gray-900 rounded-lg overflow-hidden shadow-xl border border-brand-blue/20 hover:border-brand-blue/40 transition-colors">
      <div className="flex flex-col md:flex-row">
        {/* Image Section - Added hover effect to this div instead of parent */}
        <div className="md:w-2/5 relative h-80 md:h-auto overflow-hidden p-4 md:pl-6 group">
          <div className="relative w-full h-full">
            <Image 
              src={imageSrc} 
              alt={imageAlt}
              fill
              className="object-contain transition-transform duration-500 group-hover:scale-105"
              priority
              sizes="(max-width: 768px) 100vw, 40vw"
            />
          </div>
        </div>
        
        {/* Content Section */}
        <div className="md:w-3/5 p-6 md:p-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-2 text-brand-gold hover:text-brand-gold-light transition-colors">{title}</h2>
          <p className="text-gray-300 mb-4">{date}</p>
          
          <div className="prose prose-invert mb-4 max-w-none">
            <p>{description}</p>
          </div>
          
          {bulletPoints.length > 0 && (
            <ul className="list-disc list-inside space-y-1 mb-4">
              {bulletPoints.map((point, index) => (
                <li key={index} className="text-gray-200">
                  <span className="text-brand-blue-light">{point.split(':')[0]}</span>
                  {point.includes(':') ? `: ${point.split(':').slice(1).join(':')}` : point}
                </li>
              ))}
            </ul>
          )}
          
          {link && (
            <Button variant="gold" size="lg" asChild className="mt-2">
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