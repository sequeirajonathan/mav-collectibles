"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import type { User, Session } from '@supabase/supabase-js';
import type { UserProfile } from '@prisma/client';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

type SupabaseContextType = {
  supabase: ReturnType<typeof createBrowserClient>;
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
  userProfile: UserProfile | null;
};

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

export function SupabaseProvider({ children }: { children: ReactNode }) {
  const [supabase] = useState(() => createBrowserClient(supabaseUrl, supabaseAnonKey));
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const router = useRouter();

  const fetchUserProfile = async (email: string) => {
    try {
      console.log('Fetching user profile for email:', email);
      
      // Try to fetch from Prisma first (through our API)
      const prismaResponse = await fetch('/api/user-profile');
      const prismaProfile = await prismaResponse.json();
      
      if (prismaProfile && !prismaProfile.error) {
        console.log('Found profile in Prisma:', prismaProfile);
        return prismaProfile;
      }

      // If no Prisma profile, try Supabase
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select(`
          id,
          email,
          role,
          created_at,
          updated_at
        `)
        .eq('email', email)
        .single();

      if (profileError) {
        console.error('Profile fetch error:', {
          message: profileError.message,
          details: profileError.details,
          hint: profileError.hint,
          code: profileError.code
        });
        return null;
      }

      console.log('Successfully fetched user profile from Supabase:', profile);
      return profile;
    } catch (error) {
      console.error('Unexpected error in fetchUserProfile:', error);
      return null;
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        setUser(session?.user ?? null);
        setSession(session);
        
        if (session?.user?.email) {
          const profile = await fetchUserProfile(session.user.email);
          console.log('Setting user profile:', profile);
          setUserProfile(profile);
        } else {
          setUserProfile(null);
        }
        
        setLoading(false);
        
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
          router.refresh();
        }
      }
    );

    // Initial session check
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log('Initial session check:', session?.user?.email);
      setUser(session?.user ?? null);
      setSession(session);
      
      if (session?.user?.email) {
        const profile = await fetchUserProfile(session.user.email);
        console.log('Setting initial user profile:', profile);
        setUserProfile(profile);
      }
      
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router]);

  useEffect(() => {
    const pathname = window.location.pathname;
    const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/signup');
    const isProtectedRoute = pathname.startsWith('/admin') || pathname.startsWith('/dashboard');
    
    if (!user && !loading && !isAuthPage && isProtectedRoute) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const value = {
    supabase,
    user,
    session,
    loading,
    signOut,
    isAuthenticated: !!user,
    userProfile,
  };

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  );
}

export function useSupabase() {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
} 