"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getBrowserClient } from "@utils/supabase/client";
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
  /** Picks up a session that a server action just set (sign-in, password reset). */
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const user = session?.user ?? null;

  const loadProfile = useCallback(async (userId: string | undefined) => {
    if (!userId) {
      setProfile(null);
      return;
    }
    const supabase = await getBrowserClient();
    const { data } = await supabase
      .from("profiles")
      .select("username, first_name, last_name, phone")
      .eq("id", userId)
      .maybeSingle();
    setProfile(data ?? null);
  }, []);

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;
    // supabase-js loads after hydration, so it never delays the first render.
    void getBrowserClient().then(async (supabase) => {
      if (!active) return;
      const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
        setSession(nextSession);
        setIsLoaded(true);
        void loadProfile(nextSession?.user.id);
      });
      unsubscribe = () => listener.subscription.unsubscribe();
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      setSession(data.session);
      setIsLoaded(true);
      void loadProfile(data.session?.user.id);
    });
    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [loadProfile]);

  const signOut = useCallback(async () => {
    await (await getBrowserClient()).auth.signOut();
    setSession(null);
    setProfile(null);
  }, []);

  const refreshProfile = useCallback(() => loadProfile(user?.id), [loadProfile, user?.id]);

  const refreshSession = useCallback(async () => {
    const { data } = await (await getBrowserClient()).auth.getSession();
    setSession(data.session);
    await loadProfile(data.session?.user.id);
  }, [loadProfile]);

  const value = useMemo<AuthState>(
    () => ({
      isLoaded,
      user,
      session,
      role: user ? parseRole(user.app_metadata?.role) : null,
      profile,
      signOut,
      refreshProfile,
      refreshSession,
    }),
    [isLoaded, user, session, profile, signOut, refreshProfile, refreshSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
