/**
 * (app)/_layout.tsx  —  Main App Layout (Stack Navigator)
 *
 * No bottom tab bar — navigation happens via the dashboard FAB row and
 * secondary actions grid.
 *
 * On mount it loads the user's project via useProject().
 * If no project exists (first login), redirects to the onboarding screen.
 */
import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { View, Text, ActivityIndicator } from 'react-native';
import { useProject } from '@/hooks/useProject';

export default function AppLayout() {
  const { data: project, isPending } = useProject();

  useEffect(() => {
    if (!isPending && project === null) {
      router.replace('/(app)/onboarding');
    }
  }, [project, isPending]);

  if (isPending) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0f0f1a', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#4f7bff" />
        <Text style={{ color: '#8888aa', marginTop: 12, fontSize: 14 }}>Cargando proyecto...</Text>
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}
