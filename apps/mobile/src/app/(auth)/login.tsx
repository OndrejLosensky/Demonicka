import { useState } from 'react';
import {
  StyleSheet,
  View,
  Image,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/auth.store';
import { FormInput } from '../../components/forms/FormInput';
import { FormButton } from '../../components/forms/FormButton';

const logo = require('../../../assets/logo.png');

const COPY = {
  title: 'Vítejte zpět!',
  subtitle: 'Přihlaste se ke svému účtu',
  username: 'Uživatelské jméno',
  password: 'Heslo',
  signIn: 'Přihlásit se',
  signingIn: 'Přihlašování...',
  errorDefault: 'Přihlášení se nezdařilo',
  twoFactorRequired: 'Vyžadováno dvoufázové ověření. Zatím není v aplikaci podporováno.',
  hasToken: 'Mám registrační token',
};

export default function LoginScreen() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const storeError = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');
    clearError();

    if (!username.trim() || !password) {
      setError('Vyplňte uživatelské jméno a heslo');
      return;
    }

    setIsLoading(true);
    try {
      const result = await login(username.trim(), password);

      if ('requiresTwoFactor' in result && result.requiresTwoFactor) {
        setError(result.message || COPY.twoFactorRequired);
        return;
      }

      // Navigate to app on success
      router.replace('/(app)/(tabs)');
    } catch (e: unknown) {
      const err = e as { status?: number; data?: { message?: string }; message?: string };
      const msg = err?.data?.message ?? err?.message ?? COPY.errorDefault;
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const displayError = error || storeError;

  return (
    <KeyboardAvoidingView
      style={styles.keyboard}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoWrap}>
          <Image source={logo} style={styles.logo} resizeMode="contain" />
        </View>
        <Text style={styles.title}>{COPY.title}</Text>
        <Text style={styles.subtitle}>{COPY.subtitle}</Text>

        <View style={styles.form}>
          {displayError ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{displayError}</Text>
            </View>
          ) : null}

          <FormInput
            label={COPY.username}
            value={username}
            onChangeText={(t) => {
              setUsername(t);
              setError('');
            }}
            placeholder={COPY.username}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="username"
            editable={!isLoading}
          />

          <FormInput
            label={COPY.password}
            value={password}
            onChangeText={(t) => {
              setPassword(t);
              setError('');
            }}
            placeholder={COPY.password}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="password"
            editable={!isLoading}
          />

          <FormButton
            title={isLoading ? COPY.signingIn : COPY.signIn}
            onPress={handleSubmit}
            loading={isLoading}
            style={styles.button}
          />

          <TouchableOpacity
            style={styles.tokenLink}
            onPress={() => router.push('/(auth)/complete-registration')}
            disabled={isLoading}
          >
            <Text style={styles.tokenLinkText}>{COPY.hasToken}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboard: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 32,
    alignItems: 'stretch',
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 220,
    height: 50,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  form: {
    maxWidth: 360,
    width: '100%',
    alignSelf: 'center',
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#dc2626',
  },
  button: {
    marginTop: 12,
  },
  tokenLink: {
    alignSelf: 'center',
    marginTop: 20,
    padding: 8,
  },
  tokenLinkText: {
    fontSize: 15,
    color: '#3b82f6',
    fontWeight: '500',
  },
});
