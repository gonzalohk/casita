import { Stack } from 'expo-router';

export default function IncomeLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0f0f1a' } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="new" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
