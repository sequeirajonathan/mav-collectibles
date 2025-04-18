"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function Profile() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    return null;
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    // Update user profile in your database
    // This is just a placeholder - implement your actual update logic
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6">
      <h1 className="text-3xl font-bold mb-6">Your Profile</h1>
      
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Account Information</h2>
        <div className="mb-4">
          <p className="text-gray-600">Email</p>
          <p className="font-medium">{user.email}</p>
        </div>
        
        <div className="mb-4">
          <p className="text-gray-600">Account Type</p>
          <p className="font-medium capitalize">
            {user.app_metadata?.provider || 'Email'}
          </p>
        </div>
        
        <form onSubmit={handleUpdateProfile} className="mt-6">
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Display Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#E6B325] focus:border-[#E6B325]"
            />
          </div>
          
          <button
            type="submit"
            className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#E6B325]"
          >
            Save Changes
          </button>
        </form>
      </div>
      
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Account Actions</h2>
        <button
          onClick={() => signOut().then(() => router.push('/'))}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
} 