"use client";

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const { signUp, signInWithGoogle, signInWithFacebook } = useAuth();
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    
    setLoading(true);
    
    try {
      const { error, data } = await signUp(email, password);
      if (error) throw error;
      
      setMessage('Check your email for the confirmation link');
    } catch (error: any) {
      setError(error.message || 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setError(null);
    try {
      const { error } = await signInWithGoogle();
      if (error) throw error;
    } catch (error: any) {
      setError(error.message || 'Failed to sign up with Google');
    }
  };

  const handleFacebookSignup = async () => {
    setError(null);
    try {
      const { error } = await signInWithFacebook();
      if (error) throw error;
    } catch (error: any) {
      setError(error.message || 'Failed to sign up with Facebook');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-black border border-[#E6B325]/30 rounded-lg shadow-lg">
      <div className="flex justify-center mb-6">
        <Image 
          src="/mav_collectibles.png" 
          alt="MAV Collectibles Logo" 
          width={200} 
          height={80} 
          className="h-auto"
        />
      </div>
      
      <h1 className="text-2xl font-bold mb-6 text-center text-[#E6B325]">Sign Up</h1>
      
      {error && (
        <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {message && (
        <div className="bg-green-900/50 border border-green-500 text-green-200 px-4 py-3 rounded mb-4">
          {message}
        </div>
      )}
      
      <form onSubmit={handleSignup} className="space-y-4">
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
            className="mt-1 block w-full px-3 py-2 bg-gray-900 border border-[#E6B325]/50 rounded-md shadow-sm focus:outline-none focus:ring-[#E6B325] focus:border-[#E6B325] text-white"
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
            className="mt-1 block w-full px-3 py-2 bg-gray-900 border border-[#E6B325]/50 rounded-md shadow-sm focus:outline-none focus:ring-[#E6B325] focus:border-[#E6B325] text-white"
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
            className="mt-1 block w-full px-3 py-2 bg-gray-900 border border-[#E6B325]/50 rounded-md shadow-sm focus:outline-none focus:ring-[#E6B325] focus:border-[#E6B325] text-white"
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
            <span className="px-2 bg-black text-[#E6B325]">Or continue with</span>
          </div>
        </div>
        
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            onClick={handleGoogleSignup}
            className="w-full flex justify-center py-2 px-4 border border-[#E6B325]/30 rounded-md shadow-sm bg-black text-sm font-medium text-[#E6B325] hover:bg-gray-900 transition-colors"
          >
            Google
          </button>
          <button
            onClick={handleFacebookSignup}
            className="w-full flex justify-center py-2 px-4 border border-[#E6B325]/30 rounded-md shadow-sm bg-black text-sm font-medium text-[#E6B325] hover:bg-gray-900 transition-colors"
          >
            Facebook
          </button>
        </div>
      </div>
      
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-400">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-[#E6B325] hover:text-[#FFD966] transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
} 