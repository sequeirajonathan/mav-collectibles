'use client'

import { User } from '@supabase/supabase-js'
import { UserProfile } from '@prisma/client'
import Image from 'next/image'

interface DashboardClientProps {
  user: User
  userProfile: UserProfile | null
}

export default function DashboardClient({ user, userProfile }: DashboardClientProps) {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-black border border-[#E6B325]/30 rounded-lg shadow-lg p-8">
        {/* Logo and Title Section */}
        <div className="flex items-center justify-center mb-8">
          <Image 
            src="/mav_collectibles.png" 
            alt="MAV Collectibles Logo" 
            width={150} 
            height={60} 
            className="w-auto h-auto"
          />
        </div>
        
        <h1 className="text-3xl font-bold text-[#E6B325] mb-8 text-center">Dashboard</h1>
        
        <div className="space-y-8">
          {/* Account Information Section */}
          <div className="border border-[#E6B325]/30 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-[#E6B325] mb-6">Account Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="text-[#E6B325]/70 text-sm">Email</div>
                <div className="text-white">{user.email}</div>
              </div>
              
              <div className="space-y-2">
                <div className="text-[#E6B325]/70 text-sm">Role</div>
                <div className="text-white">{userProfile?.role || 'CUSTOMER'}</div>
              </div>
              
              <div className="space-y-2">
                <div className="text-[#E6B325]/70 text-sm">Account Created</div>
                <div className="text-white">
                  {new Date(user.created_at).toLocaleDateString()}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="text-[#E6B325]/70 text-sm">Last Sign In</div>
                <div className="text-white">
                  {new Date(user.last_sign_in_at!).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions Section */}
          <div className="border border-[#E6B325]/30 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-[#E6B325] mb-6">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button className="w-full py-2 px-4 bg-[#E6B325] hover:bg-[#FFD966] text-black font-medium rounded-md transition-colors">
                View Orders
              </button>
              <button className="w-full py-2 px-4 border border-[#E6B325] text-[#E6B325] hover:bg-[#E6B325]/10 font-medium rounded-md transition-colors">
                Edit Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 