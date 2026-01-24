import { Redirect } from 'expo-router';

// Redirect to settings tab
export default function SystemIndex() {
  return <Redirect href="/(app)/(tabs)/settings" />;
}
