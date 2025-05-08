"use client";

import { useAppContext } from "@contexts/AppContext";
import FeaturedEvent from "./FeaturedEvent";

const FeaturedEvents = () => {
  const { getFeatureFlag, featuredEvents, isLoading } = useAppContext();
  const showFeaturedEvents = getFeatureFlag("showFeaturedEvents");

  if (isLoading) {
    return (
      <div className="animate-pulse h-32 sm:h-40 bg-gray-800 rounded-md w-full mb-6 sm:mb-8" />
    );
  }

  if (!showFeaturedEvents || !featuredEvents?.length) {
    return null;
  }

  return (
    <section className="my-8 sm:my-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <h2 className="text-2xl sm:text-3xl font-bold text-brand-gold mb-8 sm:mb-10">
        Featured Events
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {featuredEvents.map((event) => (
          <FeaturedEvent key={event.id} {...event} />
        ))}
      </div>
    </section>
  );
};

export default FeaturedEvents;
