"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { createClient } from "@utils/supabase/client";
import { parseRole, UserRole } from "@interfaces/roles";

interface Profile {
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
}

interface AuthState {
  /** True once the initial session check has finished. */
  isLoaded: boolean;
  user: User | null;
  session: Session | null;
  role: UserRole | null;
  profile: Profile | null;
  signOut: () => Promise<void>;
  /** Re-reads the profile row (after the user edits it). */
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const [isLoaded, setIsLoaded] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const user = session?.user ?? null;

  const loadProfile = useCallback(
    async (userId: string | undefined) => {
      if (!userId) {
        setProfile(null);
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("username, first_name, last_name, phone")
        .eq("id", userId)
        .maybeSingle();
      setProfile(data ?? null);
    },
    [supabase]
  );

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setIsLoaded(true);
      void loadProfile(data.session?.user.id);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setIsLoaded(true);
      void loadProfile(nextSession?.user.id);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [supabase, loadProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  }, [supabase]);

  const refreshProfile = useCallback(() => loadProfile(user?.id), [loadProfile, user?.id]);

  const value = useMemo<AuthState>(
    () => ({
      isLoaded,
      user,
      session,
      role: user ? parseRole(user.app_metadata?.role) : null,
      profile,
      signOut,
      refreshProfile,
    }),
    [isLoaded, user, session, profile, signOut, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
