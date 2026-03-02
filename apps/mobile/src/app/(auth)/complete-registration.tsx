import { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/auth.store';
import { useThemeColors } from '../../hooks/useThemeColors';
import { authService } from '../../services/auth.service';
import { FormInput } from '../../components/forms/FormInput';
import { FormButton } from '../../components/forms/FormButton';

const logo = require('../../../assets/logo.png');

const COPY = {
  title: 'Dokončení registrace',
  subtitle: 'Vložte registrační token a vytvořte si heslo',
  tokenLabel: 'Registrační token',
  tokenPlaceholder: 'např. Jméno-1234',
  usernameLabel: 'Uživatelské jméno',
  usernameLoading: 'Načítám...',
  usernameHint: 'Uživatelské jméno nelze změnit – je určeno tokenem.',
  passwordLabel: 'Heslo',
  passwordPlaceholder: 'Min. 8 znaků',
  submit: 'Dokončit registraci',
  submitting: 'Dokončuji...',
  back: 'Zpět na přihlášení',
  errorInvalidToken: 'Neplatný token',
  errorFetchUsername: 'Nepodařilo se načíst uživatelské jméno',
};

export default function CompleteRegistrationScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const completeRegistration = useAuthStore((state) => state.completeRegistration);
  const storeError = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);

  const [token, setToken] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [usernameLoading, setUsernameLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const tokenTrimmed = token.trim();

  useEffect(() => {
    if (tokenTrimmed.length >= 5) {
      let cancelled = false;
      setUsernameLoading(true);
      setError('');
      authService
        .getUsernameFromToken(tokenTrimmed)
        .then((res) => {
          if (!cancelled) setUsername(res.username ?? '');
        })
        .catch(() => {
          if (!cancelled) {
            setUsername('');
            setError(COPY.errorFetchUsername);
          }
        })
        .finally(() => {
          if (!cancelled) setUsernameLoading(false);
        });
      return () => {
        cancelled = true;
      };
    } else {
      setUsername('');
      setError('');
    }
  }, [tokenTrimmed]);

  const handleSubmit = async () => {
    setError('');
    clearError();

    if (!tokenTrimmed) {
      setError('Zadejte registrační token');
      return;
    }
    if (!username && usernameLoading) {
      setError('Počkejte na načtení uživatelského jména');
      return;
    }
    if (!username) {
      setError(COPY.errorInvalidToken);
      return;
    }
    if (!password || password.length < 8) {
      setError('Heslo musí mít alespoň 8 znaků');
      return;
    }

    setIsSubmitting(true);
    try {
      await completeRegistration(tokenTrimmed, username, password);
      router.replace('/(app)/(tabs)');
    } catch (e: unknown) {
      const err = e as { data?: { message?: string }; message?: string };
      const msg = err?.data?.message ?? err?.message ?? 'Registrace se nezdařila';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayError = error || storeError;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        keyboard: { flex: 1, backgroundColor: colors.bg },
        scrollContent: {
          flexGrow: 1,
          paddingHorizontal: 24,
          paddingTop: 80,
          paddingBottom: 32,
          alignItems: 'stretch',
        },
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
        logoWrap: { alignItems: 'center', marginBottom: 20 },
        logo: { width: 200, height: 45 },
        errorBox: {
          backgroundColor: colors.redBg,
          borderWidth: 1,
          borderColor: colors.red,
          borderRadius: 10,
          padding: 12,
          marginBottom: 16,
        },
        errorText: { fontSize: 14, color: colors.red },
        usernameField: { opacity: 0.9 },
        hint: {
          fontSize: 13,
          color: colors.textSecondary,
          marginTop: -8,
          marginBottom: 12,
        },
        button: { marginTop: 12 },
        backLink: { alignSelf: 'center', marginTop: 24, padding: 8 },
        backLinkText: { fontSize: 15, color: colors.primary, fontWeight: '500' },
      }),
    [colors]
  );

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
            label={COPY.tokenLabel}
            value={token}
            onChangeText={(t) => {
              setToken(t);
              setError('');
            }}
            placeholder={COPY.tokenPlaceholder}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isSubmitting}
          />

          <FormInput
            label={COPY.usernameLabel}
            value={usernameLoading ? COPY.usernameLoading : username}
            editable={false}
            containerStyle={styles.usernameField}
          />
          {usernameLoading && (
            <Text style={styles.hint}>{COPY.usernameLoading}</Text>
          )}
          {username && !usernameLoading && (
            <Text style={styles.hint}>{COPY.usernameHint}</Text>
          )}

          <FormInput
            label={COPY.passwordLabel}
            value={password}
            onChangeText={(t) => {
              setPassword(t);
              setError('');
            }}
            placeholder={COPY.passwordPlaceholder}
            secureTextEntry
            showPasswordToggle
            autoCapitalize="none"
            autoComplete="new-password"
            editable={!isSubmitting}
          />

          <FormButton
            title={isSubmitting ? COPY.submitting : COPY.submit}
            onPress={handleSubmit}
            loading={isSubmitting}
            disabled={!username || usernameLoading}
            style={styles.button}
          />

          <TouchableOpacity
            style={styles.backLink}
            onPress={() => router.back()}
            disabled={isSubmitting}
          >
            <Text style={styles.backLinkText}>{COPY.back}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
