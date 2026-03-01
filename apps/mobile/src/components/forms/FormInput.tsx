import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  TouchableOpacity,
} from 'react-native';

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
  const [secure, setSecure] = React.useState(!!secureTextEntry);

  React.useEffect(() => {
    setSecure(!!secureTextEntry);
  }, [secureTextEntry]);

  const isPassword = showPasswordToggle ?? secureTextEntry;
  const showToggle = showPasswordToggle && isPassword;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.inputWrap}>
        <TextInput
          style={[styles.input, error && styles.inputError, style]}
          placeholderTextColor="#9ca3af"
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

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  inputWrap: {
    position: 'relative',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    paddingRight: 44,
    fontSize: 16,
    color: '#111',
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  eyeText: {
    fontSize: 18,
  },
  inputError: {
    borderColor: '#dc2626',
  },
  error: {
    fontSize: 13,
    color: '#dc2626',
    marginTop: 4,
  },
});
