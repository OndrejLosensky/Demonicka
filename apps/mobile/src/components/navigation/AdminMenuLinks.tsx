import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Icon } from '../icons';
import { useThemeColors } from '../../hooks/useThemeColors';

const SETTINGS_USERS = '/(app)/(tabs)/settings/users';
const SETTINGS_EVENT = '/(app)/(tabs)/settings/events';

interface AdminMenuLinksProps {
  isAdmin?: boolean;
  isOperator?: boolean;
}

export function AdminMenuLinks({ isAdmin = false, isOperator = false }: AdminMenuLinksProps) {
  const router = useRouter();
  const colors = useThemeColors();

  return (
    <>
      {(isAdmin || isOperator) && (
        <TouchableOpacity
          style={[styles.menuItem, { borderBottomColor: colors.border }]}
          onPress={() => router.push(SETTINGS_USERS)}
        >
          <View style={styles.menuIconWrap}>
            <Icon name="group" size={22} color={colors.textMuted} />
          </View>
          <Text style={[styles.menuLabel, { color: colors.text }]}>Správa uživatelů</Text>
          <Text style={[styles.menuArrow, { color: colors.textMuted }]}>→</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity
        style={[styles.menuItem, styles.menuItemLast]}
        onPress={() => router.push(SETTINGS_EVENT)}
      >
        <View style={styles.menuIconWrap}>
          <Icon name="calendar" size={22} color={colors.textMuted} />
        </View>
        <Text style={[styles.menuLabel, { color: colors.text }]}>Nastavení události</Text>
        <Text style={[styles.menuArrow, { color: colors.textMuted }]}>→</Text>
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
  },
  menuItemLast: { borderBottomWidth: 0 },
  menuIconWrap: { marginRight: 12, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { flex: 1, fontSize: 15 },
  menuArrow: { fontSize: 16 },
});
