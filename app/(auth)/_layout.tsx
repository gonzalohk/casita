/**
 * (auth)/_layout.tsx  —  Auth Group Layout
 *
 * Stack navigator for unauthenticated screens.
 * All screens in this group share a dark background and no visible header.
 * Screens: login, register
 */
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0f0f1a' } }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}
