"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { User, Session, AuthChangeEvent } from "@supabase/supabase-js";
import { fetchUserProfile } from "@services/userProfileService";

import type { SupabaseContextType } from "@interfaces/supabase";
import type { UserProfile } from "@interfaces";

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

export function SupabaseProvider({ children }: { children: ReactNode }) {
  const [supabase] = useState(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ));
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Initialize Supabase client
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      setSession(session);
      if (event === 'SIGNED_OUT') {
        setUserProfile(null);
        setUser(null);
      } else if (session?.user) {
        setUser(session.user);
        try {
          const profile = await fetchUserProfile();
          setUserProfile(profile);
        } catch {
          // Handle profile fetch error silently
          setUserProfile(null);
        }
      }
      router.refresh();
    });

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      setSession(session);
      if (session?.user) {
        setUser(session.user);
        fetchUserProfile()
          .then(setUserProfile)
          .catch(() => setUserProfile(null));
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router]);

  useEffect(() => {
    const pathname = window.location.pathname;
    const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/signup");
    const isProtectedRoute = pathname.startsWith("/admin") || pathname.startsWith("/dashboard");

    if (!user && !loading && isProtectedRoute && !isAuthPage) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUserProfile(null);
      setUser(null);
      setSession(null);
      router.push('/');
      router.refresh();
    } catch {
      // Handle sign out error silently
      router.push('/');
    }
  };

  const value: SupabaseContextType = {
    supabase,
    user,
    session,
    userProfile,
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
    throw new Error("useSupabase must be used within a SupabaseProvider");
  }
  return context;
}
