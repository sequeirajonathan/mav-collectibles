"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import Navbar from "@components/ui/Navbar";

export default function NotFoundPage() {
  return (
    // if Navbar or any other client component suspends, show this
    <Suspense fallback={<div className="text-center py-20">Loading…</div>}>
      <Navbar />

      <main className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-5xl font-bold mb-4">404</h1>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-[#E6B325] text-black font-semibold rounded hover:bg-[#FFD966] transition"
        >
          Go Home
        </Link>
      </main>
    </Suspense>
  );
}