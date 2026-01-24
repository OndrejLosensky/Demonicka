import { Redirect } from 'expo-router';

// Redirect to the tab version
export default function BarrelsIndex() {
  return <Redirect href="/(app)/(tabs)/barrels" />;
}
