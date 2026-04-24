/**
 * payroll/_layout.tsx  —  Payroll Group Layout
 * Stack navigator for payroll screens (no visible header).
 * Screens: index (workers list), new-worker, new-payment, [workerId] (payment history).
 */
import { Stack } from 'expo-router';

export default function PayrollLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0f0f1a' } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="new-worker" options={{ presentation: 'modal' }} />
      <Stack.Screen name="new-payment" options={{ presentation: 'modal' }} />
      <Stack.Screen name="[workerId]" />
    </Stack>
  );
}
