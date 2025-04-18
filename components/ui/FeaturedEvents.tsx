import React from 'react';
import FeaturedEvent, { FeaturedEventProps } from './FeaturedEvent';

interface FeaturedEventsProps {
  events: FeaturedEventProps[];
  title?: string;
}

const FeaturedEvents: React.FC<FeaturedEventsProps> = ({ 
  events,
  title = "Latest Events & Releases" 
}) => {
  return (
    <section className="w-full max-w-6xl mx-auto py-4 md:py-8 px-4 md:px-0">
      <h2 className="text-2xl md:text-3xl font-bold text-center mb-4 md:mb-8">{title}</h2>
      <div className="space-y-6 md:space-y-8">
        {events.map((event, index) => (
          <FeaturedEvent key={index} {...event} />
        ))}
      </div>
    </section>
  );
};

export default FeaturedEvents; 