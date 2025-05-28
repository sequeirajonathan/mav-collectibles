'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@utils/supabase/client'
import { type EmailOtpType } from '@supabase/supabase-js'

export default function ConfirmSignupPage() {
  const [isVerifying, setIsVerifying] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const confirmationUrl = searchParams.get('confirmation_url')

  useEffect(() => {
    const verifyEmail = async () => {
      if (!confirmationUrl) {
        setError('No confirmation URL provided')
        setIsVerifying(false)
        return
      }

      try {
        const supabase = createClient()
        // Decode the URL first
        const decodedUrl = decodeURIComponent(confirmationUrl)
        const url = new URL(decodedUrl)
        
        // Get the token from the URL
        const token = url.searchParams.get('token')
        const type = url.searchParams.get('type') as EmailOtpType

        if (!token || !type) {
          setError('Invalid confirmation URL')
          setIsVerifying(false)
          return
        }

        // Verify the OTP with the token
        const { error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type,
        })

        if (error) {
          setError(error.message)
        } else {
          // Redirect to dashboard on success
          router.push('/dashboard')
        }
      } catch (err) {
        console.error('Verification error:', err)
        setError('An unexpected error occurred')
      } finally {
        setIsVerifying(false)
      }
    }

    verifyEmail()
  }, [confirmationUrl, router])

  return (
    <div className="min-h-[200px] flex items-center justify-center bg-black overflow-hidden">
      <div className="text-center">
        {isVerifying ? (
          <>
            <h1 className="text-xl font-bold text-[#E6B325]">Verifying your email...</h1>
            <p className="text-gray-400 text-sm mt-2">Please wait while we confirm your email address.</p>
          </>
        ) : error ? (
          <>
            <h1 className="text-xl font-bold text-[#E6B325]">Verification Failed</h1>
            <p className="text-gray-400 text-sm mt-2">{error}</p>
            <button
              onClick={() => router.push('/login')}
              className="mt-4 text-[#E6B325] hover:text-[#FFD966] transition-colors text-sm"
            >
              Return to Login
            </button>
          </>
        ) : null}
      </div>
    </div>
  )
} 