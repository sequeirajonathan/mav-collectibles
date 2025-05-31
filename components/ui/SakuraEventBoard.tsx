import React from "react";
import Image from "next/image";
import { Luckiest_Guy } from 'next/font/google';

interface Event {
  id: number;
  image: string;
  title: string;
  description: string;
  date: string;
  highlight?: string;
}

interface SakuraEventBoardProps {
  events: Event[];
  loading?: boolean;
}

const luckiestGuy = Luckiest_Guy({
  subsets: ['latin'],
  weight: '400',
});

const SakuraEventBoard: React.FC<SakuraEventBoardProps> = ({ events, loading }) => {
  const now = new Date();
  const upcomingEvents = events.filter(event => new Date(event.date) >= now);

  return (
    <div className="relative w-full max-w-[1350px] mx-auto pt-16 pb-8 px-4 overflow-visible min-h-[128px]">
      {/* Black background layer */}
      <div className="absolute inset-0 bg-black rounded-3xl -z-10" />
      
      {/* 🌸 Left sakura "branch" hanging off the left edge, responsive size */}
      <div className="hidden min-[1120px]:block absolute -top-28 left-0 z-0 pointer-events-none transform -translate-x-1/2" style={{ width: 224, height: 320 }}>
        <div className="mix-blend-multiply w-[224px] h-[320px]">
          <Image
            src="/images/sakura.gif"
            alt="Sakura Branch Left"
            width={224}
            height={320}
            unoptimized
            priority
            className="w-[224px] h-[320px]"
          />
        </div>
      </div>

      {/* 🌸 Right sakura "branch" hanging off the right edge, responsive size */}
      <div className="hidden min-[1120px]:block absolute -top-28 right-0 z-0 pointer-events-none transform translate-x-1/2" style={{ width: 224, height: 320 }}>
        <div className="mix-blend-multiply w-[224px] h-[320px]">
          <Image
            src="/images/sakura.gif"
            alt="Sakura Branch Right"
            width={224}
            height={320}
            className="-scale-x-100 w-[224px] h-[320px]"
            unoptimized
            priority
          />
        </div>
      </div>
      <div className="flex flex-col gap-4 relative z-10">
        {loading ? (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center bg-white/90 rounded-2xl shadow-lg border-2 border-pink-200 px-2 sm:px-4 py-3 gap-2 sm:gap-0 animate-pulse">
            <div className="flex-shrink-0 w-full sm:w-20 h-28 sm:h-20 relative mb-2 sm:mb-0 sm:mr-4 mx-auto bg-pink-100 rounded-xl" />
            <div className="flex-1 flex flex-col justify-center text-center sm:text-left">
              <div className="h-4 bg-pink-200 rounded w-1/2 mx-auto sm:mx-0 mb-2" />
              <div className="h-3 bg-pink-100 rounded w-3/4 mx-auto sm:mx-0 mb-1" />
              <div className="h-3 bg-pink-100 rounded w-2/3 mx-auto sm:mx-0" />
            </div>
            <div className="flex flex-row sm:flex-col items-center justify-center mt-2 sm:mt-0 sm:ml-4 gap-0.5 sm:gap-0">
              <div className="h-3 w-8 bg-pink-200 rounded mb-1" />
              <div className="h-6 w-16 bg-pink-100 rounded" />
            </div>
          </div>
        ) : (
          upcomingEvents.map((event, idx) => (
            <React.Fragment key={event.id}>
              <div className="flex flex-row items-center bg-white/90 rounded-lg sm:rounded-2xl shadow border border-pink-200 sm:shadow-lg sm:border-2 px-1.5 sm:px-4 py-2 sm:py-3 gap-2 sm:gap-6">
                {/* Event image */}
                <div className="flex-shrink-0 w-16 h-16 sm:w-32 sm:h-32 relative mr-2 sm:mr-0 mx-auto flex items-center justify-center sm:flex-1">
                  <Image
                    src={event.image}
                    alt={event.title}
                    fill
                    className="object-contain object-center rounded-xl border border-pink-100 bg-white"
                    sizes="(max-width: 640px) 64px, 80px"
                  />
                </div>

                {/* Event details */}
                <div className="flex-1 sm:flex-[2] flex flex-col justify-center text-left sm:items-center sm:justify-center sm:text-center">
                  {event.highlight && (
                    <span className="text-xs font-bold text-red-600 border-2 border-red-500 rounded px-2 py-0.5 mb-1 bg-white mx-auto sm:mx-0">
                      {event.highlight}
                    </span>
                  )}
                  <h2 className="text-sm sm:text-lg font-extrabold text-pink-700 mb-0.5 sakura-font drop-shadow">
                    {event.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-700 leading-tight">
                    {event.description}
                  </p>
                </div>

                {/* Event date */}
                <div className="flex flex-col items-center justify-center ml-2 sm:ml-0 sm:flex-1">
                  {(() => {
                    const dateObj = new Date(event.date);
                    const day = dateObj.getDate();
                    const monthAbbr = dateObj.toLocaleString('en-US', { month: 'short' });
                    return (
                      <>
                        <span className={`${luckiestGuy.className} text-sm sm:text-lg text-black tracking-wide mb-1`} style={{ letterSpacing: '0.05em' }}>
                          {monthAbbr.toUpperCase()}
                        </span>
                        <span className={`${luckiestGuy.className} text-4xl sm:text-6xl font-extrabold text-black leading-none`}>
                          {day}
                        </span>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Dotted divider */}
              {idx < upcomingEvents.length - 1 && (
                <div className="w-full h-1 flex items-center justify-center">
                  <div className="w-3/4 border-t border-dotted border-pink-200" />
                </div>
              )}
            </React.Fragment>
          ))
        )}
      </div>
    </div>
  );
};

export default SakuraEventBoard;
