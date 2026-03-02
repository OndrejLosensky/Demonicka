import { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useThemeColors } from '../../hooks/useThemeColors';

interface ErrorViewProps {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export function ErrorView({ message, onRetry, retryLabel = 'Zkusit znovu' }: ErrorViewProps) {
  const colors = useThemeColors();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 24,
          backgroundColor: colors.bg,
        },
        icon: { fontSize: 48, marginBottom: 16 },
        message: {
          fontSize: 16,
          color: colors.textSecondary,
          textAlign: 'center',
          marginBottom: 24,
        },
        button: {
          backgroundColor: colors.primary,
          borderRadius: 10,
          paddingVertical: 12,
          paddingHorizontal: 24,
        },
        buttonText: {
          fontSize: 16,
          fontWeight: '600',
          color: '#fff',
        },
      }),
    [colors]
  );
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>⚠️</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <TouchableOpacity style={styles.button} onPress={onRetry} activeOpacity={0.8}>
          <Text style={styles.buttonText}>{retryLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
