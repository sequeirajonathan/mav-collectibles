import { FeaturedEvent } from "@interfaces";
import FeaturedEventComponent from "./FeaturedEvent";
import { Calendar, Loader2 } from "lucide-react";

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
  // Show error state
  if (error) {
    console.error("Error loading featured events:", error);
    return null; // Silently fail as this is a non-critical component
  }

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="w-full bg-gradient-to-b from-black to-gray-900 rounded-lg overflow-hidden shadow-xl border border-brand-blue/20 h-full min-h-[340px] md:max-h-none flex items-center justify-center">
          <div className="text-center p-8">
            <Loader2 className="w-16 h-16 mx-auto mb-4 text-[#E6B325] animate-spin" />
            <h3 className="text-xl font-bold text-[#E6B325] mb-2">
              Searching for Events
            </h3>
            <p className="text-gray-300">
              Loading upcoming events...
            </p>
          </div>
        </div>
      );
    }

    // Handle no events or invalid events data
    if (!events || !Array.isArray(events) || events.length === 0) {
      return (
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
      );
    }

    // Filter and sort events
    const now = new Date();
    const upcomingEvents = events
      .filter(event => event.enabled && event.date && !isNaN(Date.parse(event.date)))
      .filter(event => new Date(event.date) >= now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (upcomingEvents.length === 0) {
      return (
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
      );
    }

    const nearest = upcomingEvents[0];
    return (
      <FeaturedEventComponent
        title={nearest.title}
        date={nearest.date}
        description={nearest.description}
        imageSrc={nearest.imageSrc}
        imageAlt={nearest.imageAlt || nearest.title || "Event image"}
        link={nearest.link}
      />
    );
  };

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
          {renderContent()}
        </div>
      </div>
    </section>
  );
}
