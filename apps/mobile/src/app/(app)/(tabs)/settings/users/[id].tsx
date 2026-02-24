import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { SafeAreaView } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import { useAuthStore } from '../../../../../store/auth.store';
import { useRole } from '../../../../../hooks/useRole';
import { api } from '../../../../../services/api';
import { config } from '../../../../../config';
import { Header } from '../../../../../components/layout/Header';
import { Icon } from '../../../../../components/icons';
import { LoadingScreen } from '../../../../../components/ui/LoadingScreen';
import { EmptyState } from '../../../../../components/ui/EmptyState';
import type { User } from '@demonicka/shared-types';

function getRoleLabel(role: string) {
  switch (role) {
    case 'SUPER_ADMIN': return 'Super Admin';
    case 'OPERATOR': return 'Operátor';
    case 'USER': return 'Uživatel';
    case 'PARTICIPANT': return 'Účastník';
    default: return role;
  }
}

export default function UserDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const token = useAuthStore((state) => state.token);
  const { isAdmin } = useRole();

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [registrationToken, setRegistrationToken] = useState<string | null>(null);
  const [generatingToken, setGeneratingToken] = useState(false);

  const registrationUrl =
    registrationToken && config.webAppUrl
      ? `${config.webAppUrl.replace(/\/$/, '')}/complete-registration?token=${encodeURIComponent(registrationToken)}`
      : '';

  const fetchUser = useCallback(async () => {
    if (!token || !id) return;
    try {
      setError(null);
      const data = await api.get<User>(`/users/${id}`, token);
      setUser(data);
    } catch (e: unknown) {
      const err = e as { message?: string };
      setError(err?.message ?? 'Nepodařilo se načíst uživatele');
      setUser(null);
    }
  }, [token, id]);

  useEffect(() => {
    setIsLoading(true);
    fetchUser().finally(() => setIsLoading(false));
  }, [fetchUser]);

  const handleGenerateToken = async () => {
    if (!token || !id) return;
    setGeneratingToken(true);
    try {
      const res = await api.post<{ token: string }>(
        `/users/${id}/register-token`,
        {},
        token
      );
      setRegistrationToken(res.token);
    } catch (e: unknown) {
      const err = e as { message?: string };
      Alert.alert('Chyba', err?.message ?? 'Nepodařilo se vygenerovat token');
    } finally {
      setGeneratingToken(false);
    }
  };

  const copyToClipboard = async (value: string, label: string) => {
    try {
      await Clipboard.setStringAsync(value);
      Alert.alert('Zkopírováno', `${label} zkopírován do schránky`);
    } catch {
      Alert.alert('Chyba', 'Nepodařilo se zkopírovat');
    }
  };

  const openRegistrationInBrowser = async () => {
    if (!registrationUrl) return;
    try {
      const can = await Linking.canOpenURL(registrationUrl);
      if (can) {
        await Linking.openURL(registrationUrl);
      } else {
        Alert.alert('Chyba', 'Odkaz nelze otevřít. Zkontrolujte EXPO_PUBLIC_WEB_APP_URL v .env.');
      }
    } catch {
      Alert.alert('Chyba', 'Nepodařilo se otevřít prohlížeč');
    }
  };

  if (!isAdmin) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header title="Detail uživatele" showBack />
        <EmptyState
          icon={<Icon name="lock" size={48} color="#9ca3af" />}
          title="Přístup odepřen"
          message="Nemáte oprávnění k této sekci."
        />
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return <LoadingScreen showLogo={false} />;
  }

  if (error || !user) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header title="Detail uživatele" showBack />
        <EmptyState
          icon={<Icon name="group" size={48} color="#9ca3af" />}
          title="Uživatel nenalezen"
          message={error ?? 'Neplatné ID.'}
        />
      </SafeAreaView>
    );
  }

  const canGenerateToken =
    user.role === 'PARTICIPANT' && !user.isRegistrationComplete;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title={user.name || user.username || 'Detail uživatele'} showBack />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* User info */}
        <View style={styles.section}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(user.name || user.username || '?').charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.userName}>{user.name || user.username}</Text>
          <Text style={styles.username}>@{user.username}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Role</Text>
            <Text style={styles.metaValue}>{getRoleLabel(user.role)}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Registrace</Text>
            <Text style={styles.metaValue}>
              {user.isRegistrationComplete ? 'Dokončena' : 'Nedokončena'}
            </Text>
          </View>
          {user.email && (
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>E-mail</Text>
              <Text style={styles.metaValue}>{user.email}</Text>
            </View>
          )}
        </View>

        {/* Registration token + QR (only for participants who haven't completed registration) */}
        {canGenerateToken && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Registrační token</Text>
            {!registrationToken ? (
              <TouchableOpacity
                style={styles.generateButton}
                onPress={handleGenerateToken}
                disabled={generatingToken}
              >
                {generatingToken ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.generateButtonText}>Vygenerovat token</Text>
                )}
              </TouchableOpacity>
            ) : (
              <>
                <Text style={styles.fieldLabel}>Token</Text>
                <View style={styles.fieldRow}>
                  <TextInput
                    style={styles.tokenInput}
                    value={registrationToken}
                    editable={false}
                  />
                  <TouchableOpacity
                    style={styles.copyButton}
                    onPress={() => copyToClipboard(registrationToken, 'Token')}
                  >
                    <Icon name="copy" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>

                <Text style={[styles.fieldLabel, styles.fieldLabelTop]}>Odkaz na registraci</Text>
                <View style={styles.fieldRow}>
                  <TextInput
                    style={styles.tokenInput}
                    value={registrationUrl}
                    editable={false}
                    numberOfLines={2}
                  />
                  <TouchableOpacity
                    style={styles.copyButton}
                    onPress={() => copyToClipboard(registrationUrl, 'Odkaz')}
                  >
                    <Icon name="copy" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>

                <Text style={[styles.fieldLabel, styles.fieldLabelTop]}>QR kód</Text>
                <View style={styles.qrWrap}>
                  <QRCode value={registrationUrl || ' '} size={180} />
                </View>
                <TouchableOpacity
                  style={styles.openBrowserButton}
                  onPress={openRegistrationInBrowser}
                >
                  <Text style={styles.openBrowserButtonText}>Otevřít v prohlížeči</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.generateButton}
                  onPress={handleGenerateToken}
                  disabled={generatingToken}
                >
                  {generatingToken ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.generateButtonText}>Vygenerovat nový token</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },
  section: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
    marginBottom: 12,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 12,
  },
  avatarText: { fontSize: 24, fontWeight: '600', color: '#fff' },
  userName: { fontSize: 20, fontWeight: '600', color: '#111', textAlign: 'center' },
  username: { fontSize: 15, color: '#6b7280', textAlign: 'center', marginTop: 4 },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  metaLabel: { fontSize: 14, color: '#6b7280' },
  metaValue: { fontSize: 14, fontWeight: '500', color: '#111' },
  fieldLabel: { fontSize: 13, fontWeight: '500', color: '#6b7280', marginBottom: 6 },
  fieldLabelTop: { marginTop: 14 },
  fieldRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tokenInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111',
  },
  copyButton: {
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 8,
  },
  qrWrap: {
    alignSelf: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  openBrowserButton: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  openBrowserButtonText: { fontSize: 15, fontWeight: '500', color: '#374151' },
  generateButton: {
    backgroundColor: '#FF0000',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 16,
    minHeight: 48,
    justifyContent: 'center',
  },
  generateButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
});
