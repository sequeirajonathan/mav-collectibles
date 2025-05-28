'use client'

import Link from 'next/link'

export default function ErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-[#E6B325] mb-4">Oops!</h1>
        <p className="text-gray-400">Sorry, something went wrong.</p>
        <Link 
          href="/"
          className="mt-4 inline-block text-[#E6B325] hover:text-[#FFD966] transition-colors"
        >
          Return to Home
        </Link>
      </div>
    </div>
  )
} 