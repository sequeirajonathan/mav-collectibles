"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import type { User, Session } from '@supabase/supabase-js';

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
};

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

export function SupabaseProvider({ children }: { children: ReactNode }) {
  // Use createBrowserClient for client-side
  const [supabase] = useState(() => createBrowserClient(supabaseUrl, supabaseAnonKey));
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        setSession(session);
        setLoading(false);
        
        // Refresh the page on sign in or sign out
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
          router.refresh();
        }
      }
    );

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setSession(session);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router]);

  useEffect(() => {
    // Don't redirect on signup or login pages
    const pathname = window.location.pathname;
    const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/signup');
    
    if (!user && !loading && !isAuthPage) {
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