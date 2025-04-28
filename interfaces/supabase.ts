import type { User, Session } from '@supabase/supabase-js';
import type { UserProfile } from '@prisma/client';

export interface SupabaseContextType {
  supabase: ReturnType<typeof import('@supabase/ssr').createBrowserClient>;
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
  userProfile: UserProfile | null;
}