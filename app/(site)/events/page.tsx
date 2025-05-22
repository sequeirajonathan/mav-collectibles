"use client";

import React from "react";
import SakuraEventBoard from "@components/ui/SakuraEventBoard";

// Fake event data
const events = [
  {
    id: 1,
    image: "/images/events/may2.png",
    title: "Open Play - Milwaukee Regional",
    description: "Join us for open play and prepare for the Milwaukee Regional!",
    date: "May 2, 2025",
  },
  {
    id: 2,
    image: "/images/events/may9.png",
    title: "Open Play (Updated)",
    description: "Open play night with new updates and fun challenges!",
    date: "May 9, 2025",
  },
  {
    id: 3,
    image: "/images/events/may16.png",
    title: "Midnight Pre-Release & VGC Challenge",
    description: "Midnight event! Pre-release and VGC challenge starts at 7:00 PM.",
    date: "May 16, 2025",
  },
  {
    id: 4,
    image: "/images/events/may23.png",
    title: "Open Play - Portland Regional",
    description: "Open play night for Portland Regional practice.",
    date: "May 23, 2025",
  },
  {
    id: 5,
    image: "/images/events/may30.png",
    title: "TCG Challenge",
    description: "TCG Challenge night! Starts at 7:00 PM.",
    date: "May 30, 2025",
  },
];

export default function EventsPage() {
  return (
    <>
      <div className="min-h-screen max-w-4xl mx-auto bg-gradient-to-br from-pink-100 via-pink-200 to-pink-300 py-10 px-2 md:px-0">
        <h1 className="text-4xl font-extrabold text-center text-pink-700 mb-8 drop-shadow-lg sakura-font">May 2025 Pokémon Events</h1>
        <SakuraEventBoard events={events} />
        <p className="mt-8 text-center text-lg font-bold text-pink-800 opacity-90">*Please arrive 30 minutes early to register for events*</p>
      </div>
    </>
  );
} 