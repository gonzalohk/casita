import { Stack } from 'expo-router';

export default function ReportsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#080b11' } }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
