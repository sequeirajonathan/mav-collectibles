'use client'

import Image from 'next/image'
import { UserRole } from '@interfaces/roles';
import { UserProfile } from '@interfaces/userProfile';
import { useSquareCustomer } from '@hooks/useSquareCustomer';
import PrintAgentClient from '@components/ui/PrintAgentClient';

interface DashboardClientProps {
  user: UserProfile;
}

export default function DashboardClient({ user }: DashboardClientProps) {
  const userRole = user.role || UserRole.USER;
  const { customer, isLoading } = useSquareCustomer(user.phoneNumber);
  
  console.log('DashboardClient - User:', {
    user,
    publicMetadata: user.publicMetadata,
    source: user.publicMetadata?.source
  });
  
  const isPrintAgent = user.publicMetadata?.source === 'print-agent';
  
  console.log('DashboardClient - isPrintAgent:', isPrintAgent);

  // If user is a print agent, render the print agent dashboard
  if (isPrintAgent) {
    return <PrintAgentClient user={user} />;
  }

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
                <div className="text-white">{user.email || ''}</div>
              </div>
              
              <div className="space-y-2">
                <div className="text-[#E6B325]/70 text-sm">Role</div>
                <div className="text-white">{userRole}</div>
              </div>
              
              <div className="space-y-2">
                <div className="text-[#E6B325]/70 text-sm">Account Created</div>
                <div className="text-white">
                  {new Date(user.createdAt).toLocaleDateString()}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="text-[#E6B325]/70 text-sm">Last Sign In</div>
                <div className="text-white">
                  {user.lastSignInAt ? new Date(user.lastSignInAt).toLocaleDateString() : ''}
                </div>
              </div>
            </div>
          </div>

          {/* Customer Information Section */}
          {isLoading ? (
            <div className="border border-[#E6B325]/30 rounded-lg p-6">
              <div className="text-[#E6B325]">Loading customer information...</div>
            </div>
          ) : customer ? (
            <div className="border border-[#E6B325]/30 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-[#E6B325] mb-6">Customer Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="text-[#E6B325]/70 text-sm">Name</div>
                  <div className="text-white">{`${customer.givenName} ${customer.familyName}`}</div>
                </div>
                
                <div className="space-y-2">
                  <div className="text-[#E6B325]/70 text-sm">Phone</div>
                  <div className="text-white">{customer.phoneNumber}</div>
                </div>
                
                {customer.address && (
                  <>
                    <div className="space-y-2">
                      <div className="text-[#E6B325]/70 text-sm">Address</div>
                      <div className="text-white">
                        {customer.address.addressLine1}
                        {customer.address.addressLine2 && <br />}
                        {customer.address.addressLine2}
                        <br />
                        {customer.address.locality}, {customer.address.postalCode}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="border border-[#E6B325]/30 rounded-lg p-6">
              <div className="text-[#E6B325]">No customer information found</div>
            </div>
          )}

          {/* Quick Actions Section */}
          <div className="border border-[#E6B325]/30 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-[#E6B325] mb-6">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button className="w-full py-2 px-4 bg-[#E6B325] hover:bg-[#FFD966] text-black font-medium rounded-md transition-colors">
                View Orders
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 