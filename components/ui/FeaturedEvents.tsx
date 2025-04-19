"use client";

import { useAppContext } from '@/contexts/AppContext';
import FeaturedEvent from './FeaturedEvent';

const FeaturedEvents = () => {
  const { featureFlags, featuredEvents, isLoading } = useAppContext();
  
  // Check if the showFeaturedEvents feature flag is enabled
  const showFeaturedEvents = featureFlags['showFeaturedEvents'];
  
  if (isLoading) {
    return <div className="animate-pulse h-40 bg-gray-800 rounded-md"></div>;
  }
  
  if (!showFeaturedEvents || featuredEvents.length === 0) {
    return null;
  }

  return (
    <div className="space-y-8 my-8">
      <h2 className="text-3xl font-bold text-brand-gold">Featured Events</h2>
      {featuredEvents.map((event) => (
        <FeaturedEvent key={event.id} {...event} />
      ))}
    </div>
  );
};

export default FeaturedEvents; 