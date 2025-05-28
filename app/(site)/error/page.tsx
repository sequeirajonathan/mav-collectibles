'use client'

import Link from 'next/link'

export default function ErrorPage() {
  return (
    <div className="h-[200px] flex items-center justify-center bg-black overflow-hidden">
      <div className="text-center">
        <h1 className="text-xl font-bold text-[#E6B325]">Oops!</h1>
        <p className="text-gray-400 text-sm">Sorry, something went wrong.</p>
        <Link 
          href="/"
          className="mt-2 inline-block text-[#E6B325] hover:text-[#FFD966] transition-colors text-sm"
        >
          Return to Home
        </Link>
      </div>
    </div>
  )
} 