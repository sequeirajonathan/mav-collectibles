import { FeaturedEvent } from "@interfaces";
import FeaturedEventComponent from "./FeaturedEvent";
import { Calendar, Loader2 } from "lucide-react";
import Link from "next/link";

interface NearestEventSectionProps {
  events: FeaturedEvent[] | undefined;
  isLoading: boolean;
  hideTitle?: boolean;
  error?: Error | null;
}

function PlaceholderCard() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center not-odd:rounded-lg p-4 min-h-[120px]">
      <Calendar className="w-10 h-10 mb-2 text-[#E6B325]" />
      <h4 className="text-lg font-bold text-[#E6B325] mb-1">No more events this month</h4>
      <p className="text-gray-400 text-sm">Check back soon for more events!</p>
    </div>
  );
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
        <div className="flex flex-col h-full w-full justify-center items-center gap-4">
          <Loader2 className="w-16 h-16 mb-2 text-[#E6B325] animate-spin" />
          <h3 className="text-xl font-bold text-[#E6B325] mb-2">Searching for Events</h3>
          <p className="text-gray-300">Loading upcoming events...</p>
        </div>
      );
    }

    // Handle no events or invalid events data
    if (!events || !Array.isArray(events) || events.length === 0) {
      return (
        <div className="flex flex-col h-full w-full justify-center items-center gap-4">
          <Calendar className="w-16 h-16 mb-2 text-[#E6B325]" />
          <h3 className="text-xl font-bold text-[#E6B325] mb-2">No Upcoming Events</h3>
          <p className="text-gray-300 mb-4">Check back soon for new events!</p>
          <button
            onClick={() => window.location.assign("/events")}
            className="text-[#E6B325] hover:text-[#FFD966] transition-colors underline"
          >
            View Past Events
          </button>
        </div>
      );
    }

    // Filter and sort events
    const now = new Date();
    const upcomingEvents = events
      .filter(event => event.enabled && event.date && !isNaN(Date.parse(event.date)))
      .filter(event => new Date(event.date) >= now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Desktop & Mobile: stack up to 2 events vertically, fill with placeholder if only 1
    const showSeeMore = upcomingEvents.length > 2;
    const showSecondEvent = upcomingEvents.length > 1;
    return (
      <div className="flex flex-col h-full w-full gap-0">
        {/* First event card */}
        <div className="flex flex-1 min-h-0">
          <div className="h-full w-full flex flex-col items-center justify-center">
            <FeaturedEventComponent
              {...upcomingEvents[0]}
              className="border-0 shadow-none hover:border-0 hover:shadow-none bg-none"
              showSeeMoreButton={showSeeMore && !showSecondEvent}
            />
          </div>
        </div>
        {/* Divider if there is a second card */}
        <div className="w-full items-center justify-center flex">
          <div className="h-px bg-gradient-to-r from-[#5865F2] via-[#5865F2] to-[#E6B325] flex-grow" />
        </div>
        {/* Second event card, if present, or placeholder if only one event */}
        {showSecondEvent ? (
          <div className="flex flex-1 min-h-0">
            <div className="h-full w-full flex flex-col items-center justify-center">
              <FeaturedEventComponent
                {...upcomingEvents[1]}
                className="border-0 shadow-none hover:border-0 hover:shadow-none bg-none"
                showSeeMoreButton={showSeeMore}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-1 min-h-0">
            <div className="h-full w-full flex flex-col items-center justify-center">
              <PlaceholderCard />
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <section className={`${!hideTitle ? "my-8 sm:my-12" : ""} w-full h-full`}>
      {!hideTitle && (
        <h2 className="text-2xl font-bold text-center mb-4 text-[#E6B325]">
          Upcoming Event{events && events.length > 1 ? "s" : ""}
        </h2>
      )}
      <div className="flex justify-center h-full">
        <div
          className="w-full h-[340px] md:h-auto bg-gradient-to-b from-black to-gray-900 rounded-lg overflow-hidden shadow-xl border border-brand-blue/20 px-4 md:px-8"
        >
          {renderContent()}
        </div>
      </div>
    </section>
  );
}
