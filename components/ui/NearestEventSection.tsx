import { FeaturedEvent } from "@interfaces";
import FeaturedEventComponent from "./FeaturedEvent";
import { Calendar } from "lucide-react";

interface NearestEventSectionProps {
  events: FeaturedEvent[] | undefined;
  isLoading: boolean;
  hideTitle?: boolean;
  error?: Error | null;
}

export default function NearestEventSection({
  events,
  isLoading,
  hideTitle,
  error,
}: NearestEventSectionProps) {
  // Show loading state
  if (isLoading) {
    return (
      <div className="animate-pulse h-32 sm:h-40 bg-gray-800 rounded-md w-full mb-6 sm:mb-8" />
    );
  }

  // Show error state
  if (error) {
    console.error("Error loading featured events:", error);
    return null; // Silently fail as this is a non-critical component
  }

  // Handle no events or invalid events data
  if (!events || !Array.isArray(events) || events.length === 0) {
    return (
      <section className={`${!hideTitle ? "my-8 sm:my-12" : ""} w-full h-full`}>
        {!hideTitle && (
          <h2 className="text-2xl font-bold text-center mb-4 text-[#E6B325]">
            Upcoming Event
          </h2>
        )}
        <div className="flex justify-center h-full">
          <div className={`w-full ${!hideTitle ? "px-4 md:px-8" : ""} h-full`}>
            <div className="w-full bg-gradient-to-b from-black to-gray-900 rounded-lg overflow-hidden shadow-xl border border-brand-blue/20 h-full min-h-[340px] md:max-h-none flex items-center justify-center">
              <div className="text-center p-8">
                <Calendar className="w-16 h-16 mx-auto mb-4 text-[#E6B325]" />
                <h3 className="text-xl font-bold text-[#E6B325] mb-2">
                  No Upcoming Events
                </h3>
                <p className="text-gray-300 mb-4">
                  Check back soon for new events!
                </p>
                <button
                  onClick={() => window.location.assign("/events")}
                  className="text-[#E6B325] hover:text-[#FFD966] transition-colors underline"
                >
                  View Past Events
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Now we know events is a non-empty array
  const now = new Date();
  const enabledEvents = events
    .filter((e) => e.enabled && e.date && !isNaN(Date.parse(e.date)))
    .filter((e) => new Date(e.date) >= now) // Only include future events
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (enabledEvents.length === 0) {
    return (
      <section className={`${!hideTitle ? "my-8 sm:my-12" : ""} w-full h-full`}>
        {!hideTitle && (
          <h2 className="text-2xl font-bold text-center mb-4 text-[#E6B325]">
            Upcoming Event
          </h2>
        )}
        <div className="flex justify-center h-full">
          <div className={`w-full ${!hideTitle ? "px-4 md:px-8" : ""} h-full`}>
            <div className="w-full bg-gradient-to-b from-black to-gray-900 rounded-lg overflow-hidden shadow-xl border border-brand-blue/20 h-full min-h-[340px] md:max-h-none flex items-center justify-center">
              <div className="text-center p-8">
                <Calendar className="w-16 h-16 mx-auto mb-4 text-[#E6B325]" />
                <h3 className="text-xl font-bold text-[#E6B325] mb-2">
                  No Upcoming Events
                </h3>
                <p className="text-gray-300 mb-4">
                  Check back soon for new events!
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const nearest = enabledEvents[0];

  return (
    <section className={`${!hideTitle ? "my-8 sm:my-12" : ""} w-full h-full`}>
      {!hideTitle && (
        <h2 className="text-2xl font-bold text-center mb-4 text-[#E6B325]">
          Upcoming Event
        </h2>
      )}
      <div className="flex justify-center h-full">
        <div
          className={`w-full ${
            !hideTitle ? "px-4 md:px-8" : ""
          } cursor-pointer h-full`}
          onClick={() => window.location.assign("/events")}
        >
          <FeaturedEventComponent
            title={nearest.title}
            date={nearest.date}
            description={nearest.description}
            imageSrc={nearest.imageSrc}
            imageAlt={nearest.imageAlt || nearest.title || "Event image"}
            link={nearest.link}
          />
        </div>
      </div>
    </section>
  );
}
