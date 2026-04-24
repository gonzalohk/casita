/**
 * schedule/_layout.tsx  —  Schedule Group Layout
 * Stack navigator for schedule screens (no visible header).
 * Screens: index (task list), new (create task), [id] (edit task), phases (manage phases).
 */
import { Stack } from 'expo-router';

export default function ScheduleLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}
