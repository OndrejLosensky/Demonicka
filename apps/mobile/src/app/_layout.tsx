import { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '../store/auth.store';
import { useThemeStore } from '../store/theme.store';
import { useUpdateStore } from '../store/update.store';
import { useTheme } from '../hooks/useTheme';
import { useThemeColors } from '../hooks/useThemeColors';
import { useToastStore } from '../store/toast.store';
import { useExpoUpdates } from '../hooks/useExpoUpdates';
import { Toast } from '../components/ui/Toast';
import { UpdatePromptModal } from '../components/ui/UpdatePromptModal';

export default function RootLayout() {
  const bootstrap = useAuthStore((state) => state.bootstrap);
  const hydrateTheme = useThemeStore((state) => state.hydrate);
  const { visible, message, type, hideToast, showError } = useToastStore();
  const { showUpdateModal, dismissUpdatePrompt, showUpdatePrompt } =
    useUpdateStore();
  const { isDark } = useTheme();
  const { checkForUpdate, fetchAndReload, isEnabled } = useExpoUpdates();
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    bootstrap();
    hydrateTheme();
  }, [bootstrap, hydrateTheme]);

  useEffect(() => {
    if (!isEnabled) return;
    const t = setTimeout(async () => {
      const result = await checkForUpdate();
      if (result.isAvailable) {
        showUpdatePrompt();
      }
    }, 1000);
    return () => clearTimeout(t);
  }, [isEnabled, checkForUpdate, showUpdatePrompt]);

  const handleUpdate = async () => {
    setIsDownloading(true);
    const result = await fetchAndReload();
    if (!result.success) {
      setIsDownloading(false);
      showError(result.error ?? 'Aktualizace se nezdařila');
    }
  };

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
      <UpdatePromptModal
        visible={showUpdateModal}
        onClose={dismissUpdatePrompt}
        onUpdate={handleUpdate}
        isLoading={isDownloading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
