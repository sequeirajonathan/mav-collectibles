"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@utils/supabase/client";
import { User, AuthResponse } from "@supabase/supabase-js";
import { UserProfile } from "@prisma/client";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  isAdmin: boolean;
  isStaff: boolean;
  isManager: boolean;
  isOwner: boolean;
  refreshUser: () => Promise<void>;
  signOut: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ error: Error | null }>;
  signup: (email: string, password: string, phoneNumber?: string) => Promise<AuthResponse>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Debug logging function
  const debug = (...args: any[]) => {
    if (process.env.NEXT_PUBLIC_DEBUG === 'true') {
      console.log('🔐 AuthContext:', ...args);
    }
  };

  useEffect(() => {
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      debug('Auth state changed:', { event, session: session?.user?.email });
      
      if (session?.user) {
        setUser(session.user);
        await fetchUserProfile(session.user.id);
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        debug('No access token available');
        setUserProfile(null);
        return;
      }

      const response = await fetch('/api/v1/user-profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 503) {
        debug('Maintenance mode detected');
        setUserProfile(null);
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch user profile: ${response.status}`);
      }

      const profile = await response.json();
      debug('User profile fetched:', profile);
      setUserProfile(profile);
    } catch (error) {
      debug('Error fetching user profile:', error);
      setUserProfile(null);
    }
  };

  const refreshUser = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      const { data: { session }, error } = await supabase.auth.getSession();

      // If there's no session, just clear state (don't treat as error)
      if (!session) {
        setUser(null);
        setUserProfile(null);
        return;
      }

      // If there's an error and it's not a missing refresh token, handle it
      if (error && !error.message.includes('Refresh Token Not Found')) {
        console.error('Error refreshing user:', error);
        setUser(null);
        setUserProfile(null);
        return;
      }

      setUser(session.user);
      if (session.user?.email) {
        await fetchUserProfile(session.user.id);
      } else {
        setUserProfile(null);
      }
    } catch (error: any) {
      // Only log unexpected errors
      if (error?.name !== 'AuthSessionMissingError' && 
          !error?.message?.includes('Refresh Token Not Found')) {
        console.error('Error refreshing user:', error);
      }
      setUser(null);
      setUserProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      debug('🔐 AuthContext - Starting sign out process');
      const supabase = createClient();
      
      debug('🔐 AuthContext - Clearing local state');
      // Clear all state first
      setUser(null);
      setUserProfile(null);
      
      debug('🔐 AuthContext - Calling Supabase signOut');
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        debug('🔐 AuthContext - Sign out error from Supabase:', error);
        throw error;
      }

      debug('🔐 AuthContext - Sign out successful, forcing refresh');
      
      // Force a hard refresh to clear all state and session
      window.location.href = '/';
    } catch (error) {
      debug('🔐 AuthContext - Unexpected sign out error:', error);
      // Still clear state and force refresh even if there's an error
      setUser(null);
      setUserProfile(null);
      debug('🔐 AuthContext - Forcing refresh after error');
      window.location.href = '/';
    }
  };

  const login = async (email: string, password: string): Promise<{ error: Error | null }> => {
    try {
      debug('Attempting login for:', email);
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        debug('Login error:', error);
        return { error };
      }

      if (data.user) {
        debug('Login successful:', data.user.email);
        await fetchUserProfile(data.user.id);
        return { error: null };
      }

      return { error: new Error('No user data returned') };
    } catch (error) {
      debug('Unexpected login error:', error);
      return { error: error instanceof Error ? error : new Error('An unexpected error occurred') };
    }
  };

  const signup = async (email: string, password: string, phoneNumber?: string) => {
    try {
      const supabase = await createClient();
      const response = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            phone_number: phoneNumber,
          },
          emailRedirectTo: `${window.location.origin}/confirm-signup`,
        },
      });

      if (response.error) throw response.error;

      await refreshUser();
      return response;
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const isAdmin = userProfile?.role === 'ADMIN';
  const isStaff = userProfile?.role === 'STAFF';
  const isManager = userProfile?.role === 'MANAGER';
  const isOwner = userProfile?.role === 'OWNER';

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        isLoading: loading,
        isAdmin,
        isStaff,
        isManager,
        isOwner,
        refreshUser,
        signOut,
        login,
        signup,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
} 