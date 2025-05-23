import { FeaturedEvent } from '@interfaces';
import FeaturedEventComponent from './FeaturedEvent';

interface NearestEventSectionProps {
  events: FeaturedEvent[] | undefined;
  isLoading: boolean;
  hideTitle?: boolean;
}

export default function NearestEventSection({ events, isLoading, hideTitle }: NearestEventSectionProps) {
  if (isLoading) {
    return (
      <div className="animate-pulse h-32 sm:h-40 bg-gray-800 rounded-md w-full mb-6 sm:mb-8" />
    );
  }

  if (!events || events.length === 0) return null;

  const now = new Date();
  const enabledEvents = events
    .filter((e) => e.enabled && e.date && !isNaN(Date.parse(e.date)))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let nearest = enabledEvents.find((e) => new Date(e.date) >= now);
  if (!nearest && enabledEvents.length > 0) {
    nearest = enabledEvents[0];
  }
  if (!nearest) return null;

  return (
    <section className={`${!hideTitle ? 'my-8 sm:my-12' : ''} w-full h-full`}>
      {!hideTitle && (
        <h2 className="text-2xl font-bold text-center mb-4 text-[#E6B325]">Upcoming Event</h2>
      )}
      <div className="flex justify-center h-full">
        <div
          className={`w-full ${!hideTitle ? 'px-4 md:px-8' : ''} cursor-pointer h-full`}
          onClick={() => window.location.assign('/events')}
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