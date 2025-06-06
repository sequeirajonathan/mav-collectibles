import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

export interface FeaturedEventProps {
  title: string;
  date: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  link?: string;
  className?: string;
  showSeeMoreButton?: boolean;
  seeMoreLink?: React.ReactNode;
}

function getMonthAndDay(dateString: string) {
  const dateObj = new Date(dateString);
  if (isNaN(dateObj.getTime())) return { month: '', day: '' };
  const month = dateObj.toLocaleString('en-US', { month: 'short' });
  const day = dateObj.getDate();
  return { month, day };
}

const FeaturedEvent: React.FC<FeaturedEventProps> = ({
  title,
  date,
  description,
  imageSrc,
  imageAlt,
  link: _link,
  className = "",
  showSeeMoreButton = false,
  seeMoreLink
}) => {
  const hasNoShadow = className.includes('shadow-none');
  const baseShadow = hasNoShadow ? '' : 'shadow hover:shadow-md hover:shadow-brand-blue/10';
  const { month, day } = getMonthAndDay(date);

  // If showSeeMoreButton, make the card clickable on mobile only
  const cardContent = (
    <>
      {/* Image Section */}
      <div className="flex items-center justify-center">
        <div className="relative w-[32px] h-[48px] md:w-[80px] md:h-[120px]">
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            className="object-contain select-none"
            priority
            draggable="false"
            sizes="(max-width: 640px) 32px, (max-width: 768px) 60px, 80px"
          />
        </div>
      </div>
      {/* Center: Title, Description, Button/Link */}
      <div className="flex-1 min-w-0 flex flex-col items-center justify-center text-center gap-1 px-1 min-h-[60px] md:gap-2 md:px-2 md:min-h-[80px]">
        <h2 className="text-sm md:text-lg font-bold text-[#E6B325] hover:text-[#FFD966] transition-colors leading-tight break-words whitespace-normal w-full">{title}</h2>
        <div className="prose prose-invert max-w-none text-xs md:text-sm mb-1 w-full">
          <p className="line-clamp-2 md:line-clamp-3 break-words">{description}</p>
        </div>
        {seeMoreLink && (
          <div className="mt-2 flex justify-center">{seeMoreLink}</div>
        )}
        {showSeeMoreButton && (
          <>
            {/* Mobile: show as small link (span if card is a link), Desktop: show as button */}
            <span className="block md:hidden mt-1">
              <span className="text-[#E6B325] underline text-xs cursor-pointer">See More Events</span>
            </span>
            <span className="hidden md:block mt-2 w-full max-w-[160px] md:max-w-none">
              <Link href="/events" className="inline-block rounded bg-[#E6B325] text-black font-bold text-xs md:text-sm hover:bg-[#FFD966] transition-colors self-center px-3 py-1 md:px-4 md:py-2 w-full">See More Events</Link>
            </span>
          </>
        )}
      </div>
      {/* Date Section */}
      <div className="flex flex-col items-center justify-center w-12 md:w-16 flex-shrink-0 flex-grow-0 text-center">
        <span className="text-base md:text-xl font-bold text-[#E6B325] tracking-wide uppercase">{month}</span>
        <span className="text-2xl md:text-4xl font-extrabold text-[#E6B325] leading-none">{day}</span>
      </div>
    </>
  );

  // If seeMoreLink exists, make the whole card clickable on mobile
  if (seeMoreLink) {
    return (
      <>
        {/* Mobile: clickable card */}
        <Link
          href="/events"
          className={`block md:hidden w-full h-full ${baseShadow} ${className} min-h-[80px]`}
          tabIndex={0}
        >
          <div className="flex flex-row items-center gap-x-2 p-2 h-full cursor-pointer">
            {/* Image Section */}
            <div className="flex items-center justify-center">
              <div className="relative w-[32px] h-[48px] md:w-[80px] md:h-[120px]">
                <Image
                  src={imageSrc}
                  alt={imageAlt}
                  fill
                  className="object-contain select-none"
                  priority
                  draggable="false"
                  sizes="(max-width: 640px) 32px, (max-width: 768px) 60px, 80px"
                />
              </div>
            </div>
            {/* Center: Title, Description, Button/Link */}
            <div className="flex-1 min-w-0 flex flex-col items-center justify-center text-center gap-1 px-1 min-h-[60px] md:gap-2 md:px-2 md:min-h-[80px]">
              <h2 className="text-sm md:text-lg font-bold text-[#E6B325] hover:text-[#FFD966] transition-colors leading-tight break-words whitespace-normal w-full">{title}</h2>
              <div className="prose prose-invert max-w-none text-xs md:text-sm mb-1 w-full">
                <p className="line-clamp-2 md:line-clamp-3 break-words">{description}</p>
              </div>
              {/* Render as span, not Link, to avoid nested <a> */}
              <span className="mt-2 text-[#E6B325] hover:text-[#FFD966] transition-colors underline text-base font-semibold">See More Events</span>
            </div>
            {/* Date Section */}
            <div className="flex flex-col items-center justify-center w-12 md:w-16 flex-shrink-0 flex-grow-0 text-center">
              <span className="text-base md:text-xl font-bold text-[#E6B325] tracking-wide uppercase">{month}</span>
              <span className="text-2xl md:text-4xl font-extrabold text-[#E6B325] leading-none">{day}</span>
            </div>
          </div>
        </Link>
        {/* Desktop: normal card */}
        <div className={`hidden md:flex w-full overflow-hidden h-full min-h-[80px] flex-row items-center gap-x-6 p-4 transition-all duration-150 ${baseShadow} ${className} select-none`}>
          {cardContent}
        </div>
      </>
    );
  }

  return (
    <div className={`w-full overflow-hidden h-full min-h-[80px] flex flex-row items-center gap-x-2 md:gap-x-6 p-2 md:p-4 transition-all duration-150 ${baseShadow} ${className} select-none`}>
      {cardContent}
    </div>
  );
};

export default FeaturedEvent; 