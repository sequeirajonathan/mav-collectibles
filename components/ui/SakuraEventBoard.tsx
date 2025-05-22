import React from "react";
import Image from "next/image";

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
}

const SakuraEventBoard: React.FC<SakuraEventBoardProps> = ({ events }) => {
  return (
    <div className="relative w-full max-w-[1350px] mx-auto pt-16 pb-8 px-4 overflow-visible">
      {/* Black background layer */}
      <div className="absolute inset-0 bg-black rounded-3xl -z-10" />
      
      {/* 🌸 Left sakura "branch" hanging off the left edge, responsive size */}
      <div className="hidden min-[1120px]:block absolute -top-28 left-0 z-0 pointer-events-none transform -translate-x-1/2">
        <div className="mix-blend-multiply">
          <Image
            src="/images/sakura.gif"
            alt="Sakura Branch Left"
            width={224}
            height={320}
            unoptimized
            className="w-[224px] h-[320px]"
          />
        </div>
      </div>

      {/* 🌸 Right sakura "branch" hanging off the right edge, responsive size */}
      <div className="hidden min-[1120px]:block absolute -top-28 right-0 z-0 pointer-events-none transform translate-x-1/2">
        <div className="mix-blend-multiply">
          <Image
            src="/images/sakura.gif"
            alt="Sakura Branch Right"
            width={224}
            height={320}
            className="-scale-x-100 w-[224px] h-[320px]"
            unoptimized
          />
        </div>
      </div>
      <div className="flex flex-col gap-4 relative z-10">
        {events.map((event, idx) => (
          <React.Fragment key={event.id}>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center bg-white/90 rounded-2xl shadow-lg border-2 border-pink-200 px-2 sm:px-4 py-3 gap-2 sm:gap-0">
              {/* Event image */}
              <div className="flex-shrink-0 w-full sm:w-20 h-28 sm:h-20 relative mb-2 sm:mb-0 sm:mr-4 mx-auto">
                <Image
                  src={event.image}
                  alt={event.title}
                  fill
                  className="object-contain object-center rounded-xl border border-pink-100 bg-white"
                  sizes="(max-width: 640px) 100vw, 80px"
                />
              </div>

              {/* Event details */}
              <div className="flex-1 flex flex-col justify-center text-center sm:text-left">
                {event.highlight && (
                  <span className="text-xs font-bold text-red-600 border-2 border-red-500 rounded px-2 py-0.5 mb-1 bg-white mx-auto sm:mx-0">
                    {event.highlight}
                  </span>
                )}
                <h2 className="text-base sm:text-lg font-extrabold text-pink-700 mb-0.5 sakura-font drop-shadow">
                  {event.title}
                </h2>
                <p className="text-xs sm:text-sm text-gray-700 leading-tight">
                  {event.description}
                </p>
              </div>

              {/* Event date */}
              <div className="flex flex-row sm:flex-col items-center justify-center mt-2 sm:mt-0 sm:ml-4 gap-0.5 sm:gap-0">
                <span className="text-xs font-semibold text-gray-500">MAY</span>
                <span className="text-2xl sm:text-3xl font-extrabold text-pink-700 leading-none ml-1 sm:ml-0">
                  {event.date.replace("May ", "")}
                </span>
              </div>
            </div>

            {/* Dotted divider */}
            {idx < events.length - 1 && (
              <div className="w-full h-2 flex items-center justify-center">
                <div className="w-3/4 border-t-2 border-dotted border-pink-200" />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default SakuraEventBoard;
