"use client";

import { useState, useEffect } from "react";
import { useSupabase } from "@/contexts/SupabaseContext";
import { motion } from "framer-motion";

export default function ProfilePage() {
  const { user, userProfile } = useSupabase();
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.username || "");
    }
  }, [userProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Handle profile update logic here
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-[#E6B325] flex items-center justify-center">
        <p className="text-lg">Please sign in to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold text-[#E6B325] mb-8">Your Profile</h1>

          <div className="bg-zinc-900 rounded-lg shadow-xl p-6 border border-[#E6B325]/30">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-[#E6B325] mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={user.email || ""}
                  disabled
                  className="w-full px-4 py-2 rounded-md bg-black border border-[#E6B325]/30 text-[#E6B325] disabled:opacity-50"
                />
              </div>

              {/* Account Type Field */}
              <div>
                <label className="block text-sm font-medium text-[#E6B325] mb-2">
                  Account Type
                </label>
                <input
                  type="text"
                  value={userProfile?.role || "USER"}
                  disabled
                  className="w-full px-4 py-2 rounded-md bg-black border border-[#E6B325]/30 text-[#E6B325] disabled:opacity-50"
                />
              </div>

              {/* Display Name Field */}
              <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-[#E6B325] mb-2">
                  Display Name
                </label>
                <input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-2 rounded-md bg-black border border-[#E6B325]/30 text-[#E6B325] focus:border-[#E6B325] focus:ring-0 transition-all"
                  placeholder="Enter your display name"
                />
              </div>

              {/* Save Button */}
              <div>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-2 bg-[#E6B325] text-black font-semibold rounded-md hover:bg-[#FFD966] transition-colors duration-200 flex items-center justify-center"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 