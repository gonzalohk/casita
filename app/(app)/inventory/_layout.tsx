/**
 * inventory/_layout.tsx  —  Inventory Group Layout
 * Stack navigator for inventory/materials screens (no visible header).
 * Screens: index (materials list), new (add material), [id] (edit/delete material).
 */
import { Stack } from 'expo-router';

export default function InventoryLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0f0f1a' } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="new" options={{ presentation: 'modal' }} />
      <Stack.Screen name="[id]" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
