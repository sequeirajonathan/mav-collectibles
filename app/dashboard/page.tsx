"use client";

import { useSupabase } from '@/contexts/SupabaseContext';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';

export default function Dashboard() {
  const { user, loading, signOut } = useSupabase();
  const router = useRouter();
  const [userData, setUserData] = useState<User | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (user) {
      setUserData(user);
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#E6B325]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 bg-black border border-[#E6B325]/30 rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-6 text-[#E6B325]">Dashboard</h1>
      
      {userData && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-[#E6B325] mb-2">User Information</h2>
          <div className="bg-gray-900 p-4 rounded-md">
            <p className="text-white"><span className="text-[#E6B325]">Email:</span> {userData.user_metadata.email}</p>
            <p className="text-white"><span className="text-[#E6B325]">ID:</span> {userData.id}</p>
            <p className="text-white">
              <span className="text-[#E6B325]">Last Sign In:</span> {new Date(userData.user_metadata.last_sign_in_at || Date.now()).toLocaleString()}
            </p>
          </div>
        </div>
      )}
      
      <div className="flex justify-end">
        <button
          onClick={signOut}
          className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-[#E6B325] hover:bg-[#FFD966] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#E6B325] transition-colors"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
} 