/**
 * (app)/_layout.tsx  —  Main App Layout (Stack Navigator)
 *
 * Just renders the Stack. Each screen handles its own redirect logic
 * to avoid navigating before the Root Layout is mounted.
 */
import { Stack } from 'expo-router';

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}
