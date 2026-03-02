import React, { useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  TouchableOpacity,
} from 'react-native';
import { useThemeColors } from '../../hooks/useThemeColors';

interface FormInputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  /** When true, shows an eye icon to toggle password visibility (use with secureTextEntry). */
  showPasswordToggle?: boolean;
}

export function FormInput({
  label,
  error,
  containerStyle,
  style,
  showPasswordToggle,
  secureTextEntry,
  ...props
}: FormInputProps) {
  const colors = useThemeColors();
  const [secure, setSecure] = React.useState(!!secureTextEntry);

  React.useEffect(() => {
    setSecure(!!secureTextEntry);
  }, [secureTextEntry]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { marginBottom: 16 },
        inputWrap: { position: 'relative' as const },
        label: {
          fontSize: 14,
          fontWeight: '500',
          color: colors.textSecondary,
          marginBottom: 6,
        },
        input: {
          backgroundColor: colors.inputBg,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 10,
          paddingHorizontal: 14,
          paddingVertical: 12,
          paddingRight: 44,
          fontSize: 16,
          color: colors.text,
        },
        eyeButton: {
          position: 'absolute',
          right: 12,
          top: 0,
          bottom: 0,
          justifyContent: 'center',
        },
        eyeText: { fontSize: 18 },
        inputError: { borderColor: colors.red },
        error: { fontSize: 13, color: colors.red, marginTop: 4 },
      }),
    [colors]
  );

  const isPassword = showPasswordToggle ?? secureTextEntry;
  const showToggle = showPasswordToggle && isPassword;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.inputWrap}>
        <TextInput
          style={[styles.input, error && styles.inputError, style]}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={showToggle ? secure : secureTextEntry}
          {...props}
        />
        {showToggle && (
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setSecure((s) => !s)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.eyeText}>{secure ? '👁' : '👁‍🗨'}</Text>
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}
