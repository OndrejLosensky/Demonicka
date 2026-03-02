import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useThemeColors } from '../../hooks/useThemeColors';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  rightAction?: {
    label: string;
    onPress: () => void;
  };
}

export function Header({ title, subtitle, showBack = false, rightAction }: HeaderProps) {
  const router = useRouter();
  const colors = useThemeColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.bg, borderBottomColor: colors.border }]}>
      <View style={styles.left}>
        {showBack && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Text style={[styles.backText, { color: colors.primary }]}>←</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.center}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.subtitle, { color: colors.textMuted }]} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>

      <View style={styles.right}>
        {rightAction && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={rightAction.onPress}
            activeOpacity={0.7}
          >
            <Text style={[styles.actionText, { color: colors.primary }]} numberOfLines={1}>
              {rightAction.label}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  left: { width: 60, alignItems: 'flex-start' },
  center: { flex: 1, alignItems: 'center' },
  right: { width: 60, alignItems: 'flex-end' },
  backButton: { padding: 8, marginLeft: -8 },
  backText: { fontSize: 24 },
  title: { fontSize: 17, fontWeight: '600' },
  subtitle: { fontSize: 13, marginTop: 2 },
  actionButton: { padding: 8, marginRight: -8 },
  actionText: { fontSize: 15, fontWeight: '500' },
});
