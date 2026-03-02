import { useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Image,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Switch,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/auth.store';
import { useThemeColors } from '../../hooks/useThemeColors';
import { FormInput } from '../../components/forms/FormInput';
import { FormButton } from '../../components/forms/FormButton';
import { config } from '../../config';

const logo = require('../../../assets/logo.png');

const COPY = {
  title: 'Vítejte zpět!',
  subtitle: 'Přihlaste se ke svému účtu',
  username: 'Uživatelské jméno',
  password: 'Heslo',
  signIn: 'Přihlásit se',
  signingIn: 'Přihlašování...',
  rememberMe: 'Zapamatovat přihlášení',
  errorDefault: 'Přihlášení se nezdařilo',
  twoFactorRequired:
    'Vyžadováno dvoufázové ověření. Zatím není v aplikaci podporováno.',
  hasToken: 'Mám registrační token',
  or: 'nebo',
  signInWithGoogle: 'Přihlásit se přes Google',
};

export default function LoginScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const login = useAuthStore((state) => state.login);
  const storeError = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
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
      const result = await login(username.trim(), password, rememberMe);

      if ('requiresTwoFactor' in result && result.requiresTwoFactor) {
        setError(result.message || COPY.twoFactorRequired);
        return;
      }

      router.replace('/(app)/(tabs)');
    } catch (e: unknown) {
      const err = e as {
        status?: number;
        data?: { message?: string };
        message?: string;
      };
      const msg =
        err?.data?.message ?? err?.message ?? COPY.errorDefault;
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    Linking.openURL(config.googleAuthUrl);
  };

  const displayError = error || storeError;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        keyboard: { flex: 1 },
        scrollContent: {
          flexGrow: 1,
          paddingHorizontal: 24,
          paddingTop: 80,
          paddingBottom: 32,
          alignItems: 'stretch',
        },
        logoWrap: { alignItems: 'center', marginBottom: 24 },
        logo: { width: 220, height: 50 },
        title: {
          fontSize: 24,
          fontWeight: '700',
          color: colors.text,
          textAlign: 'center',
          marginBottom: 4,
        },
        subtitle: {
          fontSize: 15,
          color: colors.textSecondary,
          textAlign: 'center',
          marginBottom: 32,
        },
        form: { maxWidth: 360, width: '100%', alignSelf: 'center' },
        errorBox: {
          backgroundColor: colors.redBg,
          borderWidth: 1,
          borderColor: colors.red,
          borderRadius: 10,
          padding: 12,
          marginBottom: 16,
        },
        errorText: { fontSize: 14, color: colors.red },
        rememberRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        },
        rememberLabel: { fontSize: 15, color: colors.textSecondary },
        button: { marginTop: 0 },
        dividerWrap: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
        dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
        dividerText: { marginHorizontal: 12, fontSize: 14, color: colors.textSecondary },
        googleButton: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 12,
          paddingHorizontal: 16,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.card,
          gap: 10,
        },
        googleIcon: { fontSize: 18, fontWeight: '700', color: '#4285f4' },
        googleButtonText: { fontSize: 16, color: colors.text, fontWeight: '500' },
        tokenLink: { alignSelf: 'center', marginTop: 20, padding: 8 },
        tokenLinkText: { fontSize: 15, color: colors.primary, fontWeight: '500' },
      }),
    [colors]
  );

  return (
    <KeyboardAvoidingView
      style={[styles.keyboard, { backgroundColor: colors.bg }]}
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
            showPasswordToggle
            autoCapitalize="none"
            autoComplete="password"
            editable={!isLoading}
          />

          <View style={styles.rememberRow}>
            <Text style={styles.rememberLabel}>{COPY.rememberMe}</Text>
            <Switch
              value={rememberMe}
              onValueChange={setRememberMe}
              trackColor={{ false: colors.border, true: colors.greenBg }}
              thumbColor={rememberMe ? colors.green : colors.textMuted}
              disabled={isLoading}
            />
          </View>

          <FormButton
            title={isLoading ? COPY.signingIn : COPY.signIn}
            onPress={handleSubmit}
            loading={isLoading}
            style={styles.button}
          />

          <View style={styles.dividerWrap}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{COPY.or}</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.googleButton}
            onPress={handleGoogleLogin}
            disabled={isLoading}
          >
            <Text style={styles.googleIcon}>G</Text>
            <Text style={styles.googleButtonText}>
              {COPY.signInWithGoogle}
            </Text>
          </TouchableOpacity>

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
