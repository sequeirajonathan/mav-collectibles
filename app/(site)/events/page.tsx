"use client";

import React from "react";
import SakuraEventBoard from "@components/ui/SakuraEventBoard";
import { useFeaturedEvents } from "@hooks/useFeaturedEvents";
import { format } from "date-fns";

export default function EventsPage() {
  const { data: events, isLoading } = useFeaturedEvents();
  // Map to SakuraEventBoard format
  const mappedEvents = (events || [])
    .filter(e => e.enabled)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((e, idx) => {
      const dateObj = new Date(e.date);
      return {
        id: idx + 1,
        image: e.imageSrc,
        title: e.title,
        description: e.description,
        date: format(dateObj, "MMMM d, yyyy"), // e.g., "May 2, 2025"
      };
    });
  return (
    <>
      <div className="min-h-screen max-w-4xl mx-auto bg-gradient-to-br from-pink-100 via-pink-200 to-pink-300 py-10 px-2 md:px-0 rounded-3xl">
        <h1 className="text-4xl font-extrabold text-center text-pink-700 mb-8 drop-shadow-lg sakura-font">Upcoming Events</h1>
        <SakuraEventBoard events={mappedEvents} loading={isLoading} />
        <p className="mt-8 text-center text-lg font-bold text-pink-800 opacity-90">*Please arrive 30 minutes early to register for events*</p>
      </div>
    </>
  );
} 