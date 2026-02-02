import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Icon } from '../icons';

const SETTINGS_USERS = '/(app)/(tabs)/settings/users';
const SETTINGS_EVENT = '/(app)/(tabs)/settings/event-settings';

interface AdminMenuLinksProps {
  isAdmin?: boolean;
}

export function AdminMenuLinks({ isAdmin = false }: AdminMenuLinksProps) {
  const router = useRouter();

  return (
    <>
      {isAdmin && (
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push(SETTINGS_USERS)}
        >
          <View style={styles.menuIconWrap}>
            <Icon name="group" size={22} color="#6b7280" />
          </View>
          <Text style={styles.menuLabel}>Správa uživatelů</Text>
          <Text style={styles.menuArrow}>→</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity
        style={[styles.menuItem, styles.menuItemLast]}
        onPress={() => router.push(SETTINGS_EVENT)}
      >
        <View style={styles.menuIconWrap}>
          <Icon name="calendar" size={22} color="#6b7280" />
        </View>
        <Text style={styles.menuLabel}>Nastavení události</Text>
        <Text style={styles.menuArrow}>→</Text>
      </TouchableOpacity>
    </>
  );
}

const styles = StyleSheet.create({
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  menuItemLast: {
    borderBottomWidth: 0,
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
  menuArrow: {
    fontSize: 16,
    color: '#9ca3af',
  },
});
