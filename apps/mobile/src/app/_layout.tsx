import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '../store/auth.store';
import { useToastStore } from '../store/toast.store';
import { Toast } from '../components/ui/Toast';

export default function RootLayout() {
  const bootstrap = useAuthStore((state) => state.bootstrap);
  const { visible, message, type, hideToast } = useToastStore();

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
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
