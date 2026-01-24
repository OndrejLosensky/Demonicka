import { Redirect } from 'expo-router';

// Redirect to the tab version
export default function ParticipantsIndex() {
  return <Redirect href="/(app)/(tabs)/participants" />;
}
