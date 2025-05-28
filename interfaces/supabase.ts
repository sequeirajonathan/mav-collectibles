import { User, UserMetadata } from '@supabase/supabase-js'

export interface CustomUserMetadata extends UserMetadata {
  phone_number?: string;
  role?: string;
}

export interface SupabaseUser extends Omit<User, 'user_metadata'> {
  user_metadata: CustomUserMetadata;
}

export interface SupabaseSession {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: SupabaseUser;
}

export interface SupabaseAuthResponse {
  data: {
    user: SupabaseUser | null;
    session: SupabaseSession | null;
  };
  error: Error | null;
} 