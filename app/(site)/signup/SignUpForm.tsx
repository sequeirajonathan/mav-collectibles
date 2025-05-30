'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@lib/supabase/client'

export default function SignUpForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
        data: { phoneNumber },
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setError(null)
      setLoading(false)
      router.push('/login?message=Please check your email for the confirmation link. Click the link to complete your registration.')
    }
  }

  const handleGoogleSignup = async () => {
    setError(null)
    setLoading(true)
    
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  const handleFacebookSignup = async () => {
    setError(null)
    setLoading(true)
    
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-black border border-[#E6B325]/30 rounded-lg shadow-lg">
      <div className="flex justify-center mb-6">
        <Image
          src="/mav_collectibles.png"
          alt="MAV Collectibles Logo"
          width={200}
          height={80}
          className="w-auto h-auto"
        />
      </div>

      <h1 className="text-2xl font-bold mb-6 text-center text-[#E6B325]">
        Sign Up
      </h1>

      {error && (
        <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-[#E6B325]">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 bg-gray-900 border border-[#E6B325]/50 rounded-md shadow-sm focus:outline-none focus:border-[#E6B325] focus:ring-0 text-white autofill:bg-gray-900 [-webkit-autofill:focus]:bg-gray-900 [-webkit-autofill:hover]:bg-gray-900 [-webkit-autofill:active]:bg-gray-900 [-webkit-autofill]:bg-gray-900 [-webkit-autofill]:text-white [-webkit-autofill]:shadow-[0_0_0_30px_rgb(17,24,39)_inset]"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-[#E6B325]">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 bg-gray-900 border border-[#E6B325]/50 rounded-md shadow-sm focus:outline-none focus:border-[#E6B325] focus:ring-0 text-white autofill:bg-gray-900 [-webkit-autofill:focus]:bg-gray-900 [-webkit-autofill:hover]:bg-gray-900 [-webkit-autofill:active]:bg-gray-900 [-webkit-autofill]:bg-gray-900 [-webkit-autofill]:text-white [-webkit-autofill]:shadow-[0_0_0_30px_rgb(17,24,39)_inset]"
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#E6B325]">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 bg-gray-900 border border-[#E6B325]/50 rounded-md shadow-sm focus:outline-none focus:border-[#E6B325] focus:ring-0 text-white autofill:bg-gray-900 [-webkit-autofill:focus]:bg-gray-900 [-webkit-autofill:hover]:bg-gray-900 [-webkit-autofill:active]:bg-gray-900 [-webkit-autofill]:bg-gray-900 [-webkit-autofill]:text-white [-webkit-autofill]:shadow-[0_0_0_30px_rgb(17,24,39)_inset]"
          />
        </div>

        <div>
          <label htmlFor="phoneNumber" className="block text-sm font-medium text-[#E6B325]">
            Phone Number
          </label>
          <input
            id="phoneNumber"
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 bg-gray-900 border border-[#E6B325]/50 rounded-md shadow-sm focus:outline-none focus:border-[#E6B325] focus:ring-0 text-white autofill:bg-gray-900 [-webkit-autofill:focus]:bg-gray-900 [-webkit-autofill:hover]:bg-gray-900 [-webkit-autofill:active]:bg-gray-900 [-webkit-autofill]:bg-gray-900 [-webkit-autofill]:text-white [-webkit-autofill]:shadow-[0_0_0_30px_rgb(17,24,39)_inset]"
          />
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-[#E6B325] hover:bg-[#FFD966] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#E6B325] transition-colors"
          >
            {loading ? 'Signing up...' : 'Sign up'}
          </button>
        </div>
      </form>

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#E6B325]/30"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-black text-[#E6B325]">
              Or continue with
            </span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            onClick={handleGoogleSignup}
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-[#E6B325]/30 rounded-md shadow-sm bg-black text-sm font-medium text-[#E6B325] hover:bg-gray-900 transition-colors"
          >
            Google
          </button>
          <button
            onClick={handleFacebookSignup}
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-[#E6B325]/30 rounded-md shadow-sm bg-black text-sm font-medium text-[#E6B325] hover:bg-gray-900 transition-colors"
          >
            Facebook
          </button>
        </div>
      </div>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-400">
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-medium text-[#E6B325] hover:text-[#FFD966] transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
} 