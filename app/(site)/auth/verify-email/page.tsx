'use client'

import Link from 'next/link'

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="text-center max-w-md px-4">
        <h1 className="text-2xl font-bold text-[#E6B325] mb-4">Check your email</h1>
        <p className="text-gray-400 mb-6">
          We&apos;ve sent you an email with a link to verify your account. 
          Please check your inbox and click the link to continue.
        </p>
        <Link 
          href="/login"
          className="inline-block text-[#E6B325] hover:text-[#FFD966] transition-colors"
        >
          Return to Login
        </Link>
      </div>
    </div>
  )
} 