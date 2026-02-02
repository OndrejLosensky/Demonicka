import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Icon } from '../../../components/icons';
import { useAuthStore } from '../../../store/auth.store';
import { useRole } from '../../../hooks/useRole';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { isAdmin, isOperator, role } = useRole();

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
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Nastavení</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profil</Text>
          <View style={styles.card}>
            <View style={styles.profileHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(user?.name || user?.username || '?').charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{user?.name || user?.username}</Text>
                <Text style={styles.profileMeta}>{user?.username}</Text>
              </View>
            </View>
            <View style={styles.profileDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Role</Text>
                <Text style={styles.detailValue}>{getRoleLabel()}</Text>
              </View>
              {user?.email && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Email</Text>
                  <Text style={styles.detailValue}>{user.email}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Admin Section */}
        {isOperator && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Administrace</Text>
            <View style={styles.card}>
              {isAdmin && (
                <TouchableOpacity style={styles.menuItem}>
                  <View style={styles.menuIconWrap}>
                    <Icon name="group" size={22} color="#6b7280" />
                  </View>
                  <Text style={styles.menuLabel}>Správa uživatelů</Text>
                  <Text style={styles.menuArrow}>→</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.menuItem}>
                <View style={styles.menuIconWrap}>
                  <Icon name="calendar" size={22} color="#6b7280" />
                </View>
                <Text style={styles.menuLabel}>Nastavení události</Text>
                <Text style={styles.menuArrow}>→</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* App Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Aplikace</Text>
          <View style={styles.card}>
            <View style={styles.menuItem}>
              <View style={styles.menuIconWrap}>
                <Icon name="info" size={22} color="#6b7280" />
              </View>
              <Text style={styles.menuLabel}>Verze</Text>
              <Text style={styles.menuValue}>3.5.0</Text>
            </View>
          </View>
        </View>

        {/* Logout Button */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
            <Text style={styles.logoutText}>Odhlásit se</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111',
  },
  scroll: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    overflow: 'hidden',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
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
  avatarText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111',
  },
  profileMeta: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  profileDetails: {
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 15,
    color: '#6b7280',
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  menuIconWrap: {
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    color: '#111',
  },
  menuValue: {
    fontSize: 15,
    color: '#6b7280',
  },
  menuArrow: {
    fontSize: 16,
    color: '#9ca3af',
  },
  logoutButton: {
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#dc2626',
  },
});
