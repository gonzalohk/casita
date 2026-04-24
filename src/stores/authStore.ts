/**
 * authStore.ts
 * Global Zustand store for authentication state.
 *
 * Holds the Supabase session and the current user object.
 * The auth listener in app/_layout.tsx calls setSession() whenever
 * the auth state changes (login, logout, token refresh).
 *
 * Usage:
 *   const { session, user, signOut } = useAuthStore();
 */
import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthState {
  session: Session | null; // The active Supabase auth session (contains JWT)
  user: User | null;       // The currently logged-in user
  isLoading: boolean;      // True while we haven't yet checked session status
  setSession: (session: Session | null) => void; // Called by auth listener
  signOut: () => Promise<void>; // Calls Supabase signOut and clears state
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  isLoading: true,

  setSession: (session) =>
    set({ session, user: session?.user ?? null, isLoading: false }),

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null });
  },
}));
