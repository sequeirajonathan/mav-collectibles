import { FeaturedEvent } from "@interfaces";
import FeaturedEventComponent from "./FeaturedEvent";
import { Calendar, Loader2, CalendarX } from "lucide-react";
import Link from "next/link";
import { useFeaturedEvents } from "@hooks/useFeaturedEvents";
import { motion } from "framer-motion";

interface NearestEventSectionProps {
  hideTitle?: boolean;
}

export default function NearestEventSection({
  hideTitle,
}: NearestEventSectionProps) {
  const { data: events, isLoading, error } = useFeaturedEvents();

  if (error) {
    console.error("Error loading featured events:", error);
    return null;
  }

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col h-full w-full justify-center items-center gap-4">
          <Loader2 className="w-16 h-16 mb-2 text-[#E6B325] animate-spin" />
          <h3 className="text-xl font-bold text-[#E6B325] mb-2">
            Searching for Events
          </h3>
          <p className="text-gray-300">Loading upcoming events...</p>
        </div>
      );
    }

    if (!events || !Array.isArray(events) || events.length === 0) {
      return (
        <div className="flex flex-col h-full w-full justify-center items-center gap-4">
          <Calendar className="w-16 h-16 mb-2 text-[#E6B325]" />
          <h3 className="text-xl font-bold text-[#E6B325] mb-2">
            No Upcoming Events
          </h3>
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

    // Filter/sort logic
    const now = new Date();
    const upcomingEvents = events
      .filter((evt) => evt.enabled && evt.date && !isNaN(Date.parse(evt.date)))
      .filter((evt) => new Date(evt.date) >= now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Map last-event-of-month
    const getMonthKey = (date: Date) => `${date.getFullYear()}-${date.getMonth()}`;
    const lastEventOfMonth: Record<string, FeaturedEvent> = {};
    for (const evt of upcomingEvents) {
      const d = new Date(evt.date);
      const key = getMonthKey(d);
      if (
        !lastEventOfMonth[key] ||
        new Date(evt.date) > new Date(lastEventOfMonth[key].date)
      ) {
        lastEventOfMonth[key] = evt;
      }
    }

    const firstEvent = upcomingEvents[0];
    const secondEvent = upcomingEvents[1];
    const firstKey = firstEvent ? getMonthKey(new Date(firstEvent.date)) : null;
    const secondKey = secondEvent ? getMonthKey(new Date(secondEvent.date)) : null;
    const isFirstLast =
      firstEvent &&
      lastEventOfMonth[firstKey!] &&
      lastEventOfMonth[firstKey!].id === firstEvent.id;
    const isSecondLast =
      secondEvent &&
      lastEventOfMonth[secondKey!] &&
      lastEventOfMonth[secondKey!].id === secondEvent.id;

    // Only 1 event and it's the last of the month
    if (upcomingEvents.length === 1 && isFirstLast) {
      return (
        <div className="flex flex-col h-full w-full justify-center items-center gap-4">
          <div className="w-full py-2">
            <FeaturedEventComponent {...firstEvent} />
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="w-full h-[140px] flex items-center justify-center"
          >
            <div className="w-full h-full flex items-center justify-center px-4">
              <span className="text-gray-300 flex items-center gap-3 text-lg">
                <CalendarX className="w-6 h-6 text-[#E6B325]" />
                No more upcoming events.
              </span>
            </div>
          </motion.div>
        </div>
      );
    }

    // Two events, second is last of the month
    if (upcomingEvents.length === 2 && isSecondLast) {
      return (
        <div className="flex flex-col w-full gap-3 items-stretch">
          {upcomingEvents.slice(0, 2).map((evt, idx) => (
            <div key={evt.id} className="w-full">
              <FeaturedEventComponent
                {...evt}
                seeMoreLink={idx === 1 ? (
                  <Link
                    href="/events"
                    className="text-[#E6B325] hover:text-[#FFD966] transition-colors underline text-lg font-semibold"
                  >
                    See More Events
                  </Link>
                ) : undefined}
              />
            </div>
          ))}
        </div>
      );
    }

    // 2+ events, show first two + "See More Events"
    if (upcomingEvents.length >= 2) {
      return (
        <div className="flex flex-col w-full gap-3 items-stretch">
          {upcomingEvents.slice(0, 2).map((evt, idx) => (
            <div key={evt.id} className="w-full">
              <FeaturedEventComponent
                {...evt}
                seeMoreLink={idx === 1 ? (
                  <Link
                    href="/events"
                    className="text-[#E6B325] hover:text-[#FFD966] transition-colors underline text-lg font-semibold"
                  >
                    See More Events
                  </Link>
                ) : undefined}
              />
            </div>
          ))}
        </div>
      );
    }

    return null;
  };

  return (
    <section className={`${!hideTitle ? "my-8 sm:my-12" : ""} w-full`}>
      {!hideTitle && (
        <h2 className="text-2xl font-bold text-center mb-4 text-[#E6B325]">
          Upcoming Event{events && events.length > 1 ? "s" : ""}
        </h2>
      )}

      <div className="flex justify-center">
        {/* ====== THIS IS THE OUTER CONTAINER THAT MUST WRAP THE LINK ====== */}
        <div
          className="
            w-full
            max-w-3xl
            md:h-[340px]
            bg-gradient-to-b from-black to-gray-900
            rounded-lg
            shadow-xl
            border border-white
            px-8 md:px-12
            pt-3 pb-6 md:pt-4 md:pb-8
          "
        >
          {renderContent()}
        </div>
      </div>
    </section>
  );
}
