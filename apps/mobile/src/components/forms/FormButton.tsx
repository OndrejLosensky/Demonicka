import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';

interface FormButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  style?: ViewStyle;
}

export function FormButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  style,
}: FormButtonProps) {
  const isDisabled = loading || disabled;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        variant === 'primary' && styles.primary,
        variant === 'secondary' && styles.secondary,
        variant === 'danger' && styles.danger,
        isDisabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'secondary' ? '#111' : '#fff'} />
      ) : (
        <Text
          style={[
            styles.text,
            variant === 'secondary' && styles.secondaryText,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  primary: {
    backgroundColor: '#FF0000',
  },
  secondary: {
    backgroundColor: '#f3f4f6',
  },
  danger: {
    backgroundColor: '#dc2626',
  },
  disabled: {
    opacity: 0.6,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  secondaryText: {
    color: '#111',
  },
});
