/**
 * suppliers/_layout.tsx  —  Suppliers Group Layout
 * Stack navigator for supplier screens (no visible header).
 * Screens: index (suppliers list), new (add supplier), [id] (edit/delete supplier).
 */
import { Stack } from 'expo-router';

export default function SuppliersLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}
