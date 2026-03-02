import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '../../../store/auth.store';
import { useThemeColors } from '../../../hooks/useThemeColors';

/**
 * Handles deep link: demonicka://auth/google/callback?token=...
 * Backend redirects here after Google OAuth when ?mobile=1 was used.
 */
export default function GoogleCallbackScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { token, error: errorParam } = useLocalSearchParams<{
    token?: string;
    error?: string;
  }>();
  const setTokenFromGoogle = useAuthStore((state) => state.setTokenFromGoogle);

  useEffect(() => {
    if (errorParam) {
      router.replace('/(auth)/login');
      return;
    }
    if (!token) {
      router.replace('/(auth)/login');
      return;
    }
    let cancelled = false;
    setTokenFromGoogle(token).then(() => {
      if (!cancelled) {
        router.replace('/(app)/(tabs)');
      }
    });
    return () => {
      cancelled = true;
    };
  }, [token, errorParam, setTokenFromGoogle, router]);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
