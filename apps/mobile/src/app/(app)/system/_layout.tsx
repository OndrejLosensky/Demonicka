import { Stack } from 'expo-router';

export default function SystemLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="users" />
      <Stack.Screen name="settings" />
    </Stack>
  );
}
