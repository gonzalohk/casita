/**
 * app/_layout.tsx  —  Root Layout
 *
 * This is the entry point of the Expo Router navigation tree.
 * It wraps the entire app with:
 *   - PersistQueryClientProvider: TanStack Query with offline cache persistence
 *   - GestureHandlerRootView: required by react-native-gesture-handler
 *   - StatusBar: light icons on dark background
 *   - AuthGuard: handles login/logout redirects based on Supabase session
 *
 * Route groups:
 *   (auth)  — login / register screens (no auth required)
 *   (app)   — main app screens (require active session)
 */
import { useEffect } from 'react';
import { SplashScreen, Stack, router, useSegments } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { supabase } from '@/lib/supabase';
import { queryClient, asyncStoragePersister } from '@/lib/queryClient';
import { useAuthStore } from '@/stores/authStore';

// Prevent the splash screen from hiding until we've confirmed auth state
SplashScreen.preventAutoHideAsync();

/**
 * AuthGuard — invisible component that watches the Supabase session
 * and redirects to the correct route group.
 *
 * Flow:
 *   1. On mount: fetch the current session from Supabase
 *   2. Subscribe to onAuthStateChange for future events (login/logout)
 *   3. When session changes, redirect:
 *      - no session + not in (auth) → go to login
 *      - session + in (auth) → go to main app
 *   4. Once auth state is resolved, hide the splash screen
 */
function AuthGuard() {
  const { session, isLoading, setSession } = useAuthStore();
  const segments = useSegments();
  const inAuthGroup = segments[0] === '(auth)';

  // Listen for auth state changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // Redirect based on auth state
  useEffect(() => {
    if (isLoading) return;

    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      router.replace('/(app)');
    }
  }, [session, isLoading, inAuthGroup]);

  // Hide splash once auth is resolved
  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  return null;
}

export default function RootLayout() {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: asyncStoragePersister }}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style="light" />
        <AuthGuard />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(app)" />
        </Stack>
      </GestureHandlerRootView>
    </PersistQueryClientProvider>
  );
}
