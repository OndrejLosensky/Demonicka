import { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/auth.store';
import { authService } from '../../services/auth.service';
import { FormInput } from '../../components/forms/FormInput';
import { FormButton } from '../../components/forms/FormButton';

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

const styles = StyleSheet.create({
  keyboard: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 32,
    alignItems: 'stretch',
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
  usernameField: {
    opacity: 0.9,
  },
  hint: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: -8,
    marginBottom: 12,
  },
  button: {
    marginTop: 12,
  },
  backLink: {
    alignSelf: 'center',
    marginTop: 24,
    padding: 8,
  },
  backLinkText: {
    fontSize: 15,
    color: '#3b82f6',
    fontWeight: '500',
  },
});
