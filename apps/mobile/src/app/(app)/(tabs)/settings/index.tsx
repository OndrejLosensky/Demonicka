import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { Icon } from '../../../../components/icons';
import { AdminMenuLinks } from '../../../../components/navigation/AdminMenuLinks';
import { useAuthStore } from '../../../../store/auth.store';
import { useUpdateStore } from '../../../../store/update.store';
import { useToastStore } from '../../../../store/toast.store';
import { useRole } from '../../../../hooks/useRole';
import { useThemeColors } from '../../../../hooks/useThemeColors';
import { useExpoUpdates } from '../../../../hooks/useExpoUpdates';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { showUpdatePrompt } = useUpdateStore();
  const { showInfo, showError } = useToastStore();
  const { isOperator, isAdmin, role } = useRole();
  const colors = useThemeColors();
  const { checkForUpdate, isEnabled } = useExpoUpdates();

  const handleCheckForUpdates = async () => {
    if (!isEnabled) {
      showInfo('Aktualizace nejsou v tomto režimu k dispozici.');
      return;
    }
    const result = await checkForUpdate();
    if (result.error) {
      showError(result.error);
      return;
    }
    if (result.isAvailable) {
      showUpdatePrompt();
    } else {
      showInfo('Aplikace je aktuální.');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Odhlásit se',
      'Opravdu se chcete odhlásit?',
      [
        { text: 'Zrušit', style: 'cancel' },
        {
          text: 'Odhlásit',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const getRoleLabel = () => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'Super Admin';
      case 'OPERATOR':
        return 'Operátor';
      case 'USER':
        return 'Uživatel';
      case 'PARTICIPANT':
        return 'Účastník';
      default:
        return role;
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.bg }]}
      edges={['top']}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Nastavení</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
            Profil
          </Text>
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <View
              style={[
                styles.profileHeader,
                { borderBottomColor: colors.border },
              ]}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(user?.name || user?.username || '?')
                    .charAt(0)
                    .toUpperCase()}
                </Text>
              </View>
              <View style={styles.profileInfo}>
                <Text
                  style={[styles.profileName, { color: colors.text }]}
                >
                  {user?.name || user?.username}
                </Text>
                <Text
                  style={[styles.profileMeta, { color: colors.textMuted }]}
                >
                  {user?.username}
                </Text>
              </View>
            </View>
            <View style={styles.profileDetails}>
              <View style={styles.detailRow}>
                <Text
                  style={[styles.detailLabel, { color: colors.textMuted }]}
                >
                  Role
                </Text>
                <Text
                  style={[styles.detailValue, { color: colors.text }]}
                >
                  {getRoleLabel()}
                </Text>
              </View>
              {user?.email && (
                <View style={styles.detailRow}>
                  <Text
                    style={[styles.detailLabel, { color: colors.textMuted }]}
                  >
                    Email
                  </Text>
                  <Text
                    style={[styles.detailValue, { color: colors.text }]}
                  >
                    {user.email}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
            Vzhled
          </Text>
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <TouchableOpacity
              style={[styles.menuItem, { borderBottomWidth: 0 }]}
              onPress={() => router.push('/(app)/(tabs)/settings/appearance')}
            >
              <View style={styles.menuIconWrap}>
                <Icon name="settings" size={22} color={colors.textMuted} />
              </View>
              <Text style={[styles.menuLabel, { color: colors.text }]}>
                Preference
              </Text>
              <Text style={[styles.menuArrow, { color: colors.textMuted }]}>
                →
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {isOperator && (
          <View style={styles.section}>
            <Text
              style={[styles.sectionTitle, { color: colors.textMuted }]}
            >
              Administrace
            </Text>
            <View style={[styles.card, { backgroundColor: colors.card }]}>
              <TouchableOpacity
                style={[styles.menuItem, { borderBottomColor: colors.border }]}
                onPress={() => router.push('/(app)/(tabs)/gallery')}
              >
                <View style={styles.menuIconWrap}>
                  <Icon name="image" size={22} color={colors.textMuted} />
                </View>
                <Text style={[styles.menuLabel, { color: colors.text }]}>
                  Galerie
                </Text>
                <Text style={[styles.menuArrow, { color: colors.textMuted }]}>
                  →
                </Text>
              </TouchableOpacity>
              <AdminMenuLinks isAdmin={isAdmin} />
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
            Aplikace
          </Text>
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <TouchableOpacity
              style={[styles.menuItem, { borderBottomColor: colors.border }]}
              onPress={() => router.push('/(app)/(tabs)/settings/status')}
            >
              <View style={styles.menuIconWrap}>
                <Icon name="info" size={22} color={colors.textMuted} />
              </View>
              <Text style={[styles.menuLabel, { color: colors.text }]}>
                Stav služeb
              </Text>
              <Text style={[styles.menuArrow, { color: colors.textMuted }]}>
                →
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.menuItem, { borderBottomColor: colors.border }]}
              onPress={() => router.push('/(app)/(tabs)/settings/sync-log')}
            >
              <View style={styles.menuIconWrap}>
                <Icon name="refresh" size={22} color={colors.textMuted} />
              </View>
              <Text style={[styles.menuLabel, { color: colors.text }]}>
                Offline sync / Sync log
              </Text>
              <Text style={[styles.menuArrow, { color: colors.textMuted }]}>
                →
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.menuItem, { borderBottomColor: colors.border }]}
              onPress={handleCheckForUpdates}
            >
              <View style={styles.menuIconWrap}>
                <Icon name="refresh" size={22} color={colors.textMuted} />
              </View>
              <Text style={[styles.menuLabel, { color: colors.text }]}>
                Zkontrolovat aktualizace
              </Text>
              <Text style={[styles.menuArrow, { color: colors.textMuted }]}>
                →
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.menuItem, { borderBottomColor: colors.border }]}
              onPress={() => router.push('/(app)/(tabs)/settings/feedback')}
            >
              <View style={styles.menuIconWrap}>
                <Icon name="info" size={22} color={colors.textMuted} />
              </View>
              <Text style={[styles.menuLabel, { color: colors.text }]}>
                Zpětná vazba
              </Text>
              <Text style={[styles.menuArrow, { color: colors.textMuted }]}>
                →
              </Text>
            </TouchableOpacity>
            <View style={[styles.menuItem, { borderBottomWidth: 0 }]}>
              <View style={styles.menuIconWrap}>
                <Icon name="info" size={22} color={colors.textMuted} />
              </View>
              <Text style={[styles.menuLabel, { color: colors.text }]}>
                Verze
              </Text>
              <Text style={[styles.menuValue, { color: colors.textMuted }]} numberOfLines={2}>
                {Constants.expoConfig?.version ?? '1.0.1'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.logoutButton, { backgroundColor: colors.redBg }]}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Text style={styles.logoutText}>Odhlásit se</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 16, paddingBottom: 8 },
  title: { fontSize: 28, fontWeight: '700' },
  scroll: { flex: 1 },
  section: { paddingHorizontal: 16, marginBottom: 24 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 4,
  },
  card: { borderRadius: 12, overflow: 'hidden' },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF0000',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: { fontSize: 24, fontWeight: '600', color: '#fff' },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 18, fontWeight: '600' },
  profileMeta: { fontSize: 14, marginTop: 2 },
  profileDetails: { padding: 16 },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  detailLabel: { fontSize: 15 },
  detailValue: { fontSize: 15, fontWeight: '500' },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  menuIconWrap: {
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: { flex: 1, fontSize: 15 },
  menuValue: { fontSize: 15 },
  menuArrow: { fontSize: 16 },
  logoutButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  logoutText: { fontSize: 16, fontWeight: '600', color: '#dc2626' },
});
