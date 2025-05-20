import { createBrowserClient } from '@supabase/ssr';

let supabaseInstance: ReturnType<typeof createBrowserClient> | null = null;

export function clearSupabaseStorage() {
  if (typeof window === 'undefined') return;
  
  // Clear all Supabase-related items from localStorage
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (
      key.startsWith('sb-') || 
      key.startsWith('supabase.') ||
      key === 'mav-collectibles-auth'
    )) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key));

  // Clear all Supabase-related cookies
  document.cookie.split(';').forEach(cookie => {
    const [name] = cookie.trim().split('=');
    if (name.startsWith('sb-')) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    }
  });

  // Clear sessionStorage
  sessionStorage.clear();
}

export function createClient() {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  supabaseInstance = createBrowserClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      storageKey: 'mav-collectibles-auth',
      storage: {
        getItem: (key) => {
          if (typeof window === 'undefined') return null;
          return window.localStorage.getItem(key);
        },
        setItem: (key, value) => {
          if (typeof window === 'undefined') return;
          window.localStorage.setItem(key, value);
        },
        removeItem: (key) => {
          if (typeof window === 'undefined') return;
          window.localStorage.removeItem(key);
        },
      },
    },
  });

  return supabaseInstance;
}
