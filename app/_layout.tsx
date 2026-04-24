import { useEffect } from 'react';
import { SplashScreen, Stack, router, useSegments } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { supabase } from '@/lib/supabase';
import { queryClient, asyncStoragePersister } from '@/lib/queryClient';
import { useAuthStore } from '@/stores/authStore';

SplashScreen.preventAutoHideAsync();

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
