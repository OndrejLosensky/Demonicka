import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '../store/auth.store';
import { useThemeStore } from '../store/theme.store';
import { useTheme } from '../hooks/useTheme';
import { useThemeColors } from '../hooks/useThemeColors';
import { useToastStore } from '../store/toast.store';
import { Toast } from '../components/ui/Toast';

export default function RootLayout() {
  const bootstrap = useAuthStore((state) => state.bootstrap);
  const hydrateTheme = useThemeStore((state) => state.hydrate);
  const { visible, message, type, hideToast } = useToastStore();
  const { isDark } = useTheme();

  useEffect(() => {
    bootstrap();
    hydrateTheme();
  }, [bootstrap, hydrateTheme]);

  const colors = useThemeColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
      </Stack>
      <Toast
        visible={visible}
        message={message}
        type={type}
        onHide={hideToast}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
