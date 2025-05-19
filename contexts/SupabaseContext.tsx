"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

import { useRouter } from "next/navigation";
import { createClient } from "@lib/supabase/client";
import { fetchUserProfile } from "@services/userProfileService";

import type { SupabaseContextType } from "@interfaces/supabase";
import type { User, Session } from "@supabase/supabase-js";
import type { UserProfile } from "@interfaces";

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

export function SupabaseProvider({ children }: { children: ReactNode }) {
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        setSession(session ?? null);

        if (event === "SIGNED_IN") {
          const profile = await fetchUserProfile();
          setUserProfile(profile ?? null);
        } else if (event === "SIGNED_OUT") {
          setUserProfile(null);
        }

        setLoading(false);

        if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
          router.refresh();
        }
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user ?? null);
      setSession(session ?? null);

      if (session?.user) {
        const profile = await fetchUserProfile();
        setUserProfile(profile ?? null);
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
    await supabase.auth.signOut();
    const path = window.location.pathname;
    if (path.startsWith("/admin") || path.startsWith("/dashboard")) {
      router.push("/");
    } else {
      router.refresh();
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
